#[cfg(test)]
mod tests {
    // use starknet::{ContractAddress};
    // use dojo::world::{WorldStorage};

    use pistols::models::{
        quiz::{QuizConfig, QuizQuestion},
    };
    use pistols::tests::tester::{
        tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            OWNER, OTHER, BUMMER, RECIPIENT,
        }
    };

    const QUIZ_EVENT_1: felt252 = 'QUIZ_EVENT_1';
    const QUIZ_EVENT_2: felt252 = 'QUIZ_EVENT_2';

    fn Q1() -> ByteArray {"What is the capital of France?"}
    fn Q1_DESCRIPTION() -> ByteArray {"Sponsored by Starknet"}
    fn Q1_OPTIONS() -> Array<ByteArray> {array!["Paris", "London", "Berlin", "Madrid"]}

    fn Q2() -> ByteArray {"What is the capital of Germany?"}
    fn Q2_DESCRIPTION() -> ByteArray {"Winner wins a kiss!"}
    fn Q2_OPTIONS() -> Array<ByteArray> {array!["Berlin", "Munich", "Hamburg", "Frankfurt"]}


    //-----------------------------------------
    // quizez
    //

    #[test]
    fn test_full_quiz_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        // question 1+2
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        let question_2: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        assert_eq!(question_1.quiz_event, QUIZ_EVENT_1, "question_1.quiz_event");
        assert_eq!(question_2.quiz_event, QUIZ_EVENT_1, "question_2.quiz_event");
        assert_eq!(question_1.quiz_id, 1, "question_1.quiz_id");
        assert_eq!(question_2.quiz_id, 2, "question_2.quiz_id");
        let config: QuizConfig = sys.store.get_quiz_config();
        assert_eq!(config.quiz_count, 2, "question_2.quiz_count");
        assert_eq!(config.current_quiz_id, 0, "question_2.current_quiz_id");
        // question 3
        let question_3: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_2);
        assert_eq!(question_3.quiz_event, QUIZ_EVENT_2, "question_3.quiz_event");
        assert_eq!(question_3.quiz_id, 3, "question_3.quiz_id");
        let config: QuizConfig = sys.store.get_quiz_config();
        assert_eq!(config.quiz_count, 3, "question_3.quiz_count");
        assert_eq!(config.current_quiz_id, 0, "question_3.current_quiz_id");
        //
        // question 1...
        let question_1: QuizQuestion = tester::execute_open_quiz(@sys, OWNER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
        assert_eq!(question_1.question, Q1(), "question_1.question");
        assert_eq!(question_1.answer_number, 0, "question_1.answer_number");
        assert_gt!(question_1.timestamps.start, 0, "question_1.start");
        assert_eq!(question_1.timestamps.end, 0, "question_1.end");
        assert_eq!(sys.store.get_quiz_config().current_quiz_id, question_1.quiz_id, "question_1.opened");
        // players can answer...
        tester::execute_answer_quiz(@sys, OTHER(), question_1.quiz_id, 1);
        tester::execute_answer_quiz(@sys, BUMMER(), question_1.quiz_id, 1);
        tester::execute_answer_quiz(@sys, RECIPIENT(), question_1.quiz_id, 2);
        tester::execute_answer_quiz(@sys, OTHER(), question_1.quiz_id, 4); // can change it...
        // close it
        let question_1: QuizQuestion = tester::execute_close_quiz(@sys, OWNER(), question_1.quiz_id, 1);
        assert_eq!(question_1.answer_number, 1, "question_1.answer_number");
        assert_gt!(question_1.timestamps.end, 0, "question_1.end");
        assert_eq!(sys.store.get_quiz_config().current_quiz_id, question_1.quiz_id, "question_1.closed");
        //
        // question 2...
        let question_2: QuizQuestion = tester::execute_open_quiz(@sys, OWNER(), question_2.quiz_id, Q2(), Q2_DESCRIPTION(), Q2_OPTIONS());
        assert_eq!(question_2.question, Q2(), "question_2.question");
        assert_eq!(question_2.answer_number, 0, "question_2.answer_number");
        assert_gt!(question_2.timestamps.start, 0, "question_2.start");
        assert_eq!(question_2.timestamps.end, 0, "question_2.end");
        assert_eq!(sys.store.get_quiz_config().current_quiz_id, question_2.quiz_id, "question_2.opened");
        // players can answer...
        tester::execute_answer_quiz(@sys, OTHER(), question_2.quiz_id, 2);
        tester::execute_answer_quiz(@sys, BUMMER(), question_2.quiz_id, 3);
        tester::execute_answer_quiz(@sys, RECIPIENT(), question_2.quiz_id, 1);
        tester::execute_answer_quiz(@sys, OTHER(), question_2.quiz_id, 0); // can erase it...
        // close it
        let question_2: QuizQuestion = tester::execute_close_quiz(@sys, OWNER(), question_2.quiz_id, 1);
        assert_eq!(question_2.answer_number, 1, "question_2.answer_number");
        assert_gt!(question_2.timestamps.end, 0, "question_2.end");
        //
        // set current quiz
        tester::execute_set_current_quiz(@sys, OWNER(), question_1.quiz_id);
        assert_eq!(sys.store.get_quiz_config().current_quiz_id, question_1.quiz_id, "question_1.set_current_quiz");
        tester::execute_set_current_quiz(@sys, OWNER(), question_2.quiz_id);
        assert_eq!(sys.store.get_quiz_config().current_quiz_id, question_2.quiz_id, "question_2.set_current_quiz");
        tester::execute_set_current_quiz(@sys, OWNER(), 0);
        assert_eq!(sys.store.get_quiz_config().current_quiz_id, 0, "question_2.set_current_quiz");
    }

    #[test]
    fn test_full_quiz_admin_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), false, true);
        // question 1+2
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OTHER(), QUIZ_EVENT_1);
        tester::execute_open_quiz(@sys, OTHER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
        tester::execute_close_quiz(@sys, OTHER(), question_1.quiz_id, 1);
    }

    // quiz admin

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_create_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_create_quiz(@sys, OTHER(), QUIZ_EVENT_1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_open_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_open_quiz(@sys, OTHER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is open', 'ENTRYPOINT_FAILED'))]
    fn test_open_quiz_twice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_open_quiz(@sys, OWNER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
        tester::execute_open_quiz(@sys, OWNER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_open_quiz(@sys, OWNER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
        tester::execute_close_quiz(@sys, OTHER(), question_1.quiz_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is not open', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_twice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_open_quiz(@sys, OWNER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
        tester::execute_close_quiz(@sys, OWNER(), question_1.quiz_id, 1);
        tester::execute_close_quiz(@sys, OWNER(), question_1.quiz_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is not open', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_before_open() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_close_quiz(@sys, OWNER(), question_1.quiz_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_current_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_set_current_quiz(@sys, OTHER(), question_1.quiz_id);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid quiz', 'ENTRYPOINT_FAILED'))]
    fn test_set_current_quiz_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_set_current_quiz(@sys, OWNER(), question_1.quiz_id + 1);
    }

    // quiz players

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid quiz', 'ENTRYPOINT_FAILED'))]
    fn test_answer_invalid_quiz() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_answer_quiz(@sys, OTHER(), 1, 1);
    }
    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid quiz', 'ENTRYPOINT_FAILED'))]
    fn test_answer_unopened_quiz() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_answer_quiz(@sys, OTHER(), question_1.quiz_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid answer', 'ENTRYPOINT_FAILED'))]
    fn test_answer_invalid_answer_number() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_open_quiz(@sys, OWNER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
        tester::execute_answer_quiz(@sys, OTHER(), question_1.quiz_id, 5);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is not open', 'ENTRYPOINT_FAILED'))]
    fn test_answer_closed_quiz() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let question_1: QuizQuestion = tester::execute_create_quiz(@sys, OWNER(), QUIZ_EVENT_1);
        tester::execute_open_quiz(@sys, OWNER(), question_1.quiz_id, Q1(), Q1_DESCRIPTION(), Q1_OPTIONS());
        tester::execute_close_quiz(@sys, OWNER(), question_1.quiz_id, 1);
        tester::execute_answer_quiz(@sys, OTHER(), question_1.quiz_id, 1);
    }

}
