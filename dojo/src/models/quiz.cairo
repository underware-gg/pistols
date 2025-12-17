use starknet::{ContractAddress};
use pistols::types::timestamp::{Period};

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct QuizConfig {
    #[key]
    pub key: u8,
    //-----------------------
    pub current_party_id: u32,
    pub current_question_id: u32,
    pub quiz_party_count: u32,
}

#[derive(Clone, Drop, Serde)]
#[dojo::model]
pub struct QuizParty {
    #[key]
    pub party_id: u32,
    //-----------------------
    pub name: ByteArray,
    pub description: ByteArray,
    pub timestamps: Period,
    pub quiz_question_count: u32,
}

#[derive(Clone, Drop, Serde)]
#[dojo::model]
pub struct QuizQuestion {
    #[key]
    pub party_id: u32,
    #[key]
    pub question_id: u32,
    //-----------------------
    pub question: ByteArray,
    pub description: ByteArray,
    pub options: Array<ByteArray>,
    pub timestamps: Period,
    pub answer_number: u8,
    pub vrf: felt252,
    pub hint: ByteArray,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct QuizAnswer {
    #[key]
    pub party_id: u32,
    #[key]
    pub question_id: u32,
    #[key]
    pub player_address: ContractAddress,
    //-----------------------
    pub answer_number: u8,
    pub timestamp: u64,
}


//----------------------------------
// Traits
//
use core::num::traits::Zero;
use pistols::libs::store::{Store, StoreTrait};
use pistols::systems::community::community::{Errors as CommunityErrors};

#[generate_trait]
pub impl QuizConfigImpl of QuizConfigTrait {
    fn set_current_quiz(ref store: Store, party_id: u32, question_id: u32) {
        let mut quiz_config: QuizConfig = store.get_quiz_config();
        let quiz_party: QuizParty = store.get_quiz_party(party_id);
        assert(question_id <= quiz_party.quiz_question_count, CommunityErrors::INVALID_QUIZ);
        quiz_config.current_party_id = party_id;
        quiz_config.current_question_id = question_id;
        store.set_quiz_config(@quiz_config);
    }
}

#[generate_trait]
pub impl QuizPartyImpl of QuizPartyTrait {
    fn exists(self: @QuizParty) -> bool {
        (self.name.len().is_non_zero())
    }
    fn create_quiz_party(ref store: Store,
        name: ByteArray,
        description: ByteArray,
        start: u64,
    ) -> QuizParty {
        // increment quiz count
        let mut quiz_config: QuizConfig = store.get_quiz_config();
        quiz_config.quiz_party_count += 1;
        store.set_quiz_config(@quiz_config);
        // create question
        assert(name.len().is_non_zero(), CommunityErrors::INVALID_NAME);
        let quiz_party: QuizParty = QuizParty {
            party_id: quiz_config.quiz_party_count,
            name,
            description,
            timestamps: Period { start, end: 0 },
            quiz_question_count: 0,
        };
        store.set_quiz_party(@quiz_party);
        (quiz_party)
    }
    fn edit_quiz_party(ref store: Store,
        party_id: u32,
        name: ByteArray,
        description: ByteArray,
        start: u64,
    ) -> QuizParty {
        let mut quiz_party: QuizParty = store.get_quiz_party(party_id);
        assert(quiz_party.exists(), CommunityErrors::INVALID_PARTY);
        assert(quiz_party.timestamps.end.is_zero(), CommunityErrors::PARTY_IS_CLOSED);
        assert(name.len().is_non_zero(), CommunityErrors::INVALID_NAME);
        quiz_party.name = name;
        quiz_party.description = description;
        quiz_party.timestamps.start = start;
        store.set_quiz_party(@quiz_party);
        (quiz_party)
    }
    fn close_quiz_party(ref store: Store,
        party_id: u32,
    ) -> QuizParty {
        let mut quiz_party: QuizParty = store.get_quiz_party(party_id);
        assert(quiz_party.exists(), CommunityErrors::INVALID_PARTY);
        assert(quiz_party.timestamps.end.is_zero(), CommunityErrors::PARTY_IS_CLOSED);
        quiz_party.timestamps.end = starknet::get_block_timestamp();
        store.set_quiz_party(@quiz_party);
        (quiz_party)
    }
}

#[generate_trait]
pub impl QuizQuestionImpl of QuizQuestionTrait {
    fn is_open(self: @QuizQuestion) -> bool {
        (self.timestamps.start.is_non_zero() && self.timestamps.end.is_zero())
    }
    fn is_closed(self: @QuizQuestion) -> bool {
        (self.timestamps.end.is_non_zero())
    }
    fn create_quiz_question(ref store: Store,
        party_id: u32
    ) -> QuizQuestion {
        // increment quiz count
        let mut quiz_party: QuizParty = store.get_quiz_party(party_id);
        assert(quiz_party.exists(), CommunityErrors::INVALID_PARTY);
        assert(quiz_party.timestamps.end.is_zero(), CommunityErrors::PARTY_IS_CLOSED);
        quiz_party.quiz_question_count += 1;
        store.set_quiz_party(@quiz_party);
        // create question
        let quiz_question: QuizQuestion = QuizQuestion {
            party_id,
            question_id: quiz_party.quiz_question_count,
            question: "",
            description: "",
            hint: "",
            options: array![],
            timestamps: Default::default(),
            answer_number: 0,
            vrf: 0,
        };
        store.set_quiz_question(@quiz_question);
        (quiz_question)
    }
    fn open_quiz_question(ref store: Store,
        party_id: u32,
        question_id: u32,
        question: ByteArray,
        description: ByteArray,
        hint: ByteArray,
        options: Array<ByteArray>
    ) -> QuizQuestion {
        // party must be open
        let quiz_party: QuizParty = store.get_quiz_party(party_id);
        assert(quiz_party.exists(), CommunityErrors::INVALID_PARTY);
        assert(quiz_party.timestamps.end.is_zero(), CommunityErrors::PARTY_IS_CLOSED);
        // open question
        let mut quiz_question: QuizQuestion = store.get_quiz_question(party_id, question_id);
        assert(quiz_question.timestamps.start.is_zero(), CommunityErrors::QUESTION_IS_OPEN);
        assert(quiz_question.timestamps.end.is_zero(), CommunityErrors::QUESTION_IS_CLOSED);
        assert(options.len() >= 2, CommunityErrors::INVALID_OPTIONS);
        quiz_question.timestamps.start = starknet::get_block_timestamp();
        quiz_question.question = question;
        quiz_question.description = description;
        quiz_question.options = options;
        quiz_question.hint = hint;
        store.set_quiz_question(@quiz_question);
        // change current quiz
        QuizConfigTrait::set_current_quiz(ref store, party_id, question_id);
        // returns the quiz question
        (quiz_question)
    }
    fn close_quiz_question(ref store: Store,
        party_id: u32,
        question_id: u32,
        answer_number: u8,
        vrf: felt252
    ) -> QuizQuestion {
        let mut quiz_question: QuizQuestion = store.get_quiz_question(party_id, question_id);
        assert(quiz_question.is_open(), CommunityErrors::QUESTION_IS_NOT_OPEN);
        assert(answer_number > 0 && answer_number.into() <= quiz_question.options.len(), CommunityErrors::INVALID_ANSWER);
        quiz_question.timestamps.end = starknet::get_block_timestamp();
        quiz_question.answer_number = answer_number;
        quiz_question.vrf = vrf;
        store.set_quiz_question(@quiz_question);
        (quiz_question)
    }
    fn answer_quiz_question(ref store: Store,
        party_id: u32,
        question_id: u32,
        answer_number: u8,
    ) -> QuizAnswer {
        let quiz_question: QuizQuestion = store.get_quiz_question(party_id, question_id);
        assert(quiz_question.question.len() > 0, CommunityErrors::INVALID_QUIZ);
        assert(quiz_question.is_open(), CommunityErrors::QUESTION_IS_NOT_OPEN);
        assert(answer_number.into() <= quiz_question.options.len(), CommunityErrors::INVALID_ANSWER);
        let quiz_answer: QuizAnswer = QuizAnswer {
            party_id,
            question_id,
            player_address: starknet::get_caller_address(),
            answer_number,
            timestamp: starknet::get_block_timestamp(),
        };
        store.set_quiz_answer(@quiz_answer);
        (quiz_answer)
    }
}
