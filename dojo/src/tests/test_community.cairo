#[cfg(test)]
mod tests {
    // use starknet::{ContractAddress};
    // use dojo::world::{WorldStorage};

    use pistols::models::{
        quiz::{QuizConfig, QuizParty, QuizQuestion},
    };
    use pistols::tests::tester::{
        tester,
        tester::{
            StoreTrait,
            TestSystems, FLAGS,
            OWNER, OTHER, BUMMER, RECIPIENT,
        }
    };

    fn EVENT_NAME_1() -> ByteArray {"Event_1"}
    fn EVENT_NAME_2() -> ByteArray {"Event_2"}
    fn EVENT_NAME_3() -> ByteArray {"Event_3"}
    fn EVENT_DESC_1() -> ByteArray {"Description_1"}
    fn EVENT_DESC_2() -> ByteArray {"Description_2"}
    fn EVENT_DESC_3() -> ByteArray {"Description_3"}

    fn Q1() -> ByteArray {"What is the capital of France?"}
    fn Q1_DESC() -> ByteArray {"Sponsored by Starknet"}
    fn Q1_HINT() -> ByteArray {"its easy"}
    fn Q1_OPTIONS() -> Array<ByteArray> {array!["Paris", "London", "Berlin", "Madrid"]}

    fn Q2() -> ByteArray {"What is the capital of Germany?"}
    fn Q2_DESC() -> ByteArray {"Winner wins a kiss!"}
    fn Q2_HINT() -> ByteArray {"its hard"}
    fn Q2_OPTIONS() -> Array<ByteArray> {array!["Berlin", "Munich", "Hamburg", "Frankfurt"]}


    //-----------------------------------------
    // quizez
    //

    #[test]
    fn test_full_quiz_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        // event
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 100);
        let event_2: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_2(), EVENT_DESC_2(), 200);
        assert_eq!(event_1.name, EVENT_NAME_1(), "event_1.name");
        assert_eq!(event_1.description, EVENT_DESC_1(), "event_1.description");
        assert_eq!(event_1.timestamps.start, 100, "event_1.timestamp.start");
        assert_eq!(event_1.timestamps.end, 0, "event_1.timestamp.end");
        assert_eq!(event_2.name, EVENT_NAME_2(), "event_2.name");
        assert_eq!(event_2.description, EVENT_DESC_2(), "event_2.description");
        assert_eq!(event_2.timestamps.start, 200, "event_2.timestamp.start");
        assert_eq!(event_2.timestamps.end, 0, "event_2.timestamp.end");
        let config: QuizConfig = sys.store.get_quiz_config();
        assert_eq!(config.quiz_party_count, 2, "config.quiz_party_count");
        assert_eq!(config.current_question_id, 0, "config.current_question_id");
        // edit party
        let event_2: QuizParty = tester::execute_edit_quiz_party(@sys, OWNER(), event_2.party_id, EVENT_NAME_3(), EVENT_DESC_3(), 500);
        assert_eq!(event_2.name, EVENT_NAME_3(), "event_3.name");
        assert_eq!(event_2.description, EVENT_DESC_3(), "event_3.description");
        assert_eq!(event_2.timestamps.start, 500, "event_3.timestamp.start");
        assert_eq!(event_2.timestamps.end, 0, "event_3.timestamp.end");
        // question 1+2
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        let question_2: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        assert_eq!(question_1.party_id, event_1.party_id, "question_1.quiz_party");
        assert_eq!(question_2.party_id, event_1.party_id, "question_2.quiz_party");
        assert_eq!(question_1.question_id, 1, "question_1.question_id");
        assert_eq!(question_2.question_id, 2, "question_2.question_id");
        let event_1: QuizParty = sys.store.get_quiz_party(event_1.party_id);
        assert_eq!(event_1.party_id, event_1.party_id, "event_1.party_id");
        assert_eq!(event_1.quiz_question_count, 2, "event_1.quiz_question_count");
        // question 3
        let question_3: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_2.party_id);
        assert_eq!(question_3.party_id, event_2.party_id, "question_3.quiz_party");
        assert_eq!(question_3.question_id, 1, "question_3.question_id");
        let event_2: QuizParty = sys.store.get_quiz_party(event_2.party_id);
        assert_eq!(event_2.party_id, event_2.party_id, "event_2.party_id");
        assert_eq!(event_2.quiz_question_count, 1, "event_2.quiz_question_count");
        //
        // question 1...
        let question_1: QuizQuestion = tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
        assert_eq!(question_1.question, Q1(), "question_1.question");
        assert_eq!(question_1.description, Q1_DESC(), "question_1.description");
        assert_eq!(question_1.hint, Q1_HINT(), "question_1.hint");
        assert_eq!(question_1.answer_number, 0, "question_1.answer_number");
        assert_gt!(question_1.timestamps.start, 0, "question_1.start");
        assert_eq!(question_1.timestamps.end, 0, "question_1.end");
        assert_eq!(sys.store.get_quiz_config().current_question_id, question_1.question_id, "question_1.opened");
        // players can answer...
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, 1);
        tester::execute_answer_quiz_question(@sys, BUMMER(), event_1.party_id, question_1.question_id, 1);
        tester::execute_answer_quiz_question(@sys, RECIPIENT(), event_1.party_id, question_1.question_id, 2);
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, 4); // can change it...
        // close it
        let question_1: QuizQuestion = tester::execute_close_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, 1);
        assert_eq!(question_1.answer_number, 1, "question_1.answer_number");
        assert_gt!(question_1.timestamps.end, 0, "question_1.end");
        assert_eq!(sys.store.get_quiz_config().current_question_id, question_1.question_id, "question_1.closed");
        //
        // question 2...
        let question_2: QuizQuestion = tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_2.question_id, Q2(), Q2_DESC(), Q2_HINT(), Q2_OPTIONS());
        assert_eq!(question_2.question, Q2(), "question_2.question");
        assert_eq!(question_2.description, Q2_DESC(), "question_2.description");
        assert_eq!(question_2.hint, Q2_HINT(), "question_2.hint");
        assert_eq!(question_2.answer_number, 0, "question_2.answer_number");
        assert_gt!(question_2.timestamps.start, 0, "question_2.start");
        assert_eq!(question_2.timestamps.end, 0, "question_2.end");
        assert_eq!(sys.store.get_quiz_config().current_question_id, question_2.question_id, "question_2.opened");
        // players can answer...
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, question_2.question_id, 2);
        tester::execute_answer_quiz_question(@sys, BUMMER(), event_1.party_id, question_2.question_id, 3);
        tester::execute_answer_quiz_question(@sys, RECIPIENT(), event_1.party_id, question_2.question_id, 1);
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, question_2.question_id, 0); // can erase it...
        // close it
        let question_2: QuizQuestion = tester::execute_close_quiz_question(@sys, OWNER(), event_1.party_id, question_2.question_id, 1);
        assert_eq!(question_2.answer_number, 1, "question_2.answer_number");
        assert_gt!(question_2.timestamps.end, 0, "question_2.end");
        //
        // set current quiz
        tester::execute_set_current_quiz(@sys, OWNER(), event_1.party_id, question_1.question_id);
        assert_eq!(sys.store.get_quiz_config().current_party_id, event_1.party_id, "question_1.current_party_id");
        assert_eq!(sys.store.get_quiz_config().current_question_id, question_1.question_id, "question_1.set_current_quiz");
        tester::execute_set_current_quiz(@sys, OWNER(), event_1.party_id, question_2.question_id);
        assert_eq!(sys.store.get_quiz_config().current_party_id, event_1.party_id, "question_2.current_party_id");
        assert_eq!(sys.store.get_quiz_config().current_question_id, question_2.question_id, "question_2.set_current_quiz");
        tester::execute_set_current_quiz(@sys, OWNER(), event_2.party_id, question_3.question_id);
        assert_eq!(sys.store.get_quiz_config().current_party_id, event_2.party_id, "question_3.current_party_id");
        assert_eq!(sys.store.get_quiz_config().current_question_id, question_3.question_id, "question_3.set_current_quiz");
        tester::execute_set_current_quiz(@sys, OWNER(), event_1.party_id, 0);
        assert_eq!(sys.store.get_quiz_config().current_party_id, event_1.party_id, "+++.current_party_id");
        assert_eq!(sys.store.get_quiz_config().current_question_id, 0, "+++.set_current_quiz");
        tester::execute_set_current_quiz(@sys, OWNER(), 0, 0);
        assert_eq!(sys.store.get_quiz_config().current_party_id, 0, "---.current_party_id");
        assert_eq!(sys.store.get_quiz_config().current_question_id, 0, "---.set_current_quiz");
        // close party
        let event_1: QuizParty = tester::execute_close_quiz_party(@sys, OWNER(), event_1.party_id);
        assert_gt!(event_1.timestamps.end, 0, "event_1.end");
    }

    #[test]
    fn test_full_quiz_admin_ok() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_admin_set_is_team_member(@sys.admin, OWNER(), OTHER(), false, true);
        // question 1+2
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OTHER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
        tester::execute_close_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, 1);
    }

    // quiz admin

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid party', 'ENTRYPOINT_FAILED'))]
    fn test_edit_quiz_party_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_edit_quiz_party(@sys, OWNER(), 123, EVENT_NAME_3(), EVENT_DESC_3(), 500);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_create_quiz_party_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let _event_1: QuizParty = tester::execute_create_quiz_party(@sys, OTHER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_edit_quiz_party_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        tester::execute_edit_quiz_party(@sys, OTHER(), event_1.party_id, EVENT_NAME_3(), EVENT_DESC_3(), 500);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid party', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_party_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_close_quiz_party(@sys, OWNER(), 123);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_party_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        tester::execute_close_quiz_party(@sys, OTHER(), event_1.party_id);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid party', 'ENTRYPOINT_FAILED'))]
    fn test_create_quiz_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_create_quiz_question(@sys, OWNER(), 123);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_create_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        tester::execute_create_quiz_question(@sys, OTHER(), event_1.party_id);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Party is closed', 'ENTRYPOINT_FAILED'))]
    fn test_create_quiz_closed_party() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        tester::execute_close_quiz_party(@sys, OWNER(), event_1.party_id);
        tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid party', 'ENTRYPOINT_FAILED'))]
    fn test_open_quiz_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        tester::execute_open_quiz_question(@sys, OWNER(), 123, 1, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_open_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is open', 'ENTRYPOINT_FAILED'))]
    fn test_open_quiz_twice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
        tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Party is closed', 'ENTRYPOINT_FAILED'))]
    fn test_open_quiz_closed_party() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_close_quiz_party(@sys, OWNER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
        tester::execute_close_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is not open', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_twice() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
        tester::execute_close_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, 1);
        tester::execute_close_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is not open', 'ENTRYPOINT_FAILED'))]
    fn test_close_quiz_before_open() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_close_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Caller not admin', 'ENTRYPOINT_FAILED'))]
    fn test_set_current_quiz_not_admin() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_set_current_quiz(@sys, OTHER(), event_1.party_id, question_1.question_id);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid quiz', 'ENTRYPOINT_FAILED'))]
    fn test_set_current_quiz_invalid() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_set_current_quiz(@sys, OWNER(), event_1.party_id, question_1.question_id + 1);
    }

    // quiz players

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid quiz', 'ENTRYPOINT_FAILED'))]
    fn test_answer_invalid_quiz() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, 1, 1);
    }
    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid quiz', 'ENTRYPOINT_FAILED'))]
    fn test_answer_unopened_quiz() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, 1);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Invalid answer', 'ENTRYPOINT_FAILED'))]
    fn test_answer_invalid_answer_number() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, 5);
    }

    #[test]
    #[should_panic(expected:('COMMUNITY: Question is not open', 'ENTRYPOINT_FAILED'))]
    fn test_answer_closed_quiz() {
        let mut sys: TestSystems = tester::setup_world(FLAGS::ADMIN | FLAGS::COMMUNITY);
        let event_1: QuizParty = tester::execute_create_quiz_party(@sys, OWNER(), EVENT_NAME_1(), EVENT_DESC_1(), 0);
        let question_1: QuizQuestion = tester::execute_create_quiz_question(@sys, OWNER(), event_1.party_id);
        tester::execute_open_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, Q1(), Q1_DESC(), Q1_HINT(), Q1_OPTIONS());
        tester::execute_close_quiz_question(@sys, OWNER(), event_1.party_id, question_1.question_id, 1);
        tester::execute_answer_quiz_question(@sys, OTHER(), event_1.party_id, question_1.question_id, 1);
    }

}
