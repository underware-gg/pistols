use starknet::{ContractAddress};
use pistols::types::timestamp::{Period};

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct QuizConfig {
    #[key]
    pub key: u8,
    //-----------------------
    pub quiz_count: u32,
    pub current_quiz_id: u32,
}

#[derive(Clone, Drop, Serde)]
#[dojo::model]
pub struct QuizQuestion {
    #[key]
    pub quiz_id: u32,
    //-----------------------
    pub quiz_event: felt252,
    pub question: ByteArray,
    pub description: ByteArray,
    pub options: Array<ByteArray>,
    pub timestamps: Period,
    pub answer_number: u8,
    pub vrf: felt252,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct QuizAnswer {
    #[key]
    pub quiz_id: u32,
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
    fn set_current_quiz(ref store: Store, quiz_id: u32) {
        let mut quiz_config: QuizConfig = store.get_quiz_config();
        assert(quiz_id <= quiz_config.quiz_count, CommunityErrors::INVALID_QUIZ);
        quiz_config.current_quiz_id = quiz_id;
        store.set_quiz_config(@quiz_config);
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
    fn create_quiz_question(ref store: Store, quiz_event: felt252) -> QuizQuestion {
        // increment quiz count
        let mut quiz_config: QuizConfig = store.get_quiz_config();
        quiz_config.quiz_count += 1;
        store.set_quiz_config(@quiz_config);
        // create question
        let quiz_question: QuizQuestion = QuizQuestion {
            quiz_id: quiz_config.quiz_count,
            quiz_event: quiz_event,
            question: "",
            description: "",
            options: array![],
            timestamps: Default::default(),
            answer_number: 0,
            vrf: 0,
        };
        store.set_quiz_question(@quiz_question);
        (quiz_question)
    }
    fn open_quiz(ref store: Store, quiz_id: u32, question: ByteArray, description: ByteArray, options: Array<ByteArray>) -> QuizQuestion {
        let mut quiz_question: QuizQuestion = store.get_quiz_question(quiz_id);
        assert(quiz_question.timestamps.start.is_zero(), CommunityErrors::QUESTION_IS_OPEN);
        assert(quiz_question.timestamps.end.is_zero(), CommunityErrors::QUESTION_IS_CLOSED);
        assert(options.len() >= 2, CommunityErrors::INVALID_OPTIONS);
        quiz_question.timestamps.start = starknet::get_block_timestamp();
        quiz_question.question = question;
        quiz_question.description = description;
        quiz_question.options = options;
        store.set_quiz_question(@quiz_question);
        // change current quiz
        QuizConfigTrait::set_current_quiz(ref store, quiz_id);
        // returns the quiz question
        (quiz_question)
    }
    fn close_quiz(ref store: Store, quiz_id: u32, answer_number: u8, vrf: felt252) -> QuizQuestion {
        let mut quiz_question: QuizQuestion = store.get_quiz_question(quiz_id);
        assert(quiz_question.is_open(), CommunityErrors::QUESTION_IS_NOT_OPEN);
        assert(answer_number > 0 && answer_number.into() <= quiz_question.options.len(), CommunityErrors::INVALID_ANSWER);
        quiz_question.timestamps.end = starknet::get_block_timestamp();
        quiz_question.answer_number = answer_number;
        quiz_question.vrf = vrf;
        store.set_quiz_question(@quiz_question);
        (quiz_question)
    }
    fn answer_quiz(ref store: Store, quiz_id: u32, answer_number: u8) -> QuizAnswer {
        let quiz_question: QuizQuestion = store.get_quiz_question(quiz_id);
        assert(quiz_question.question.len() > 0, CommunityErrors::INVALID_QUIZ);
        assert(quiz_question.is_open(), CommunityErrors::QUESTION_IS_NOT_OPEN);
        assert(answer_number.into() <= quiz_question.options.len(), CommunityErrors::INVALID_ANSWER);
        let quiz_answer: QuizAnswer = QuizAnswer {
            quiz_id,
            player_address: starknet::get_caller_address(),
            answer_number,
            timestamp: starknet::get_block_timestamp(),
        };
        store.set_quiz_answer(@quiz_answer);
        (quiz_answer)
    }
}
