use starknet::{ContractAddress};

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
    pub options: Array<ByteArray>,
    pub answer_number: u8,
    pub is_open: bool,
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
            options: array![],
            answer_number: 0,
            is_open: false,
        };
        store.set_quiz_question(@quiz_question);
        (quiz_question)
    }
    fn open_quiz(ref store: Store, quiz_id: u32, question: ByteArray, options: Array<ByteArray>) -> QuizQuestion {
        let mut quiz_question: QuizQuestion = store.get_quiz_question(quiz_id);
        assert(!quiz_question.is_open, CommunityErrors::QUESTION_IS_OPEN);
        assert(quiz_question.answer_number.is_zero(), CommunityErrors::QUESTION_IS_CLOSED);
        assert(options.len() >= 2, CommunityErrors::INVALID_OPTIONS);
        quiz_question.question = question;
        quiz_question.options = options;
        quiz_question.is_open = true;
        store.set_quiz_question(@quiz_question);
        // change current quiz
        QuizConfigTrait::set_current_quiz(ref store, quiz_id);
        // returns the quiz question
        (quiz_question)
    }
    fn close_quiz(ref store: Store, quiz_id: u32, answer_number: u8) -> QuizQuestion {
        let mut quiz_question: QuizQuestion = store.get_quiz_question(quiz_id);
        assert(quiz_question.is_open, CommunityErrors::QUESTION_IS_CLOSED);
        assert(answer_number > 0 && answer_number.into() <= quiz_question.options.len(), CommunityErrors::INVALID_ANSWER);
        quiz_question.answer_number = answer_number;
        quiz_question.is_open = false;
        store.set_quiz_question(@quiz_question);
        (quiz_question)
    }
}
