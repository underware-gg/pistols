// SPDX-License-Identifier: CC0
pragma solidity ^0.8.13;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

struct PlayerGameData {
    address addr;

    bytes32 shootStepCommitment;
    uint256 shootStep;

    bytes32 battleChoiceCommitment;
    uint256 battleChoice;
}

struct Game {
    uint256 state;
    uint256 stake;
    uint256 activityDeadline;

    PlayerGameData player1;
    PlayerGameData player2;
}

contract Pistols {
    address public owner;
    ERC20 public lordsToken;

    uint256 public timeout;

    uint256 public nextGameId = 0;
    mapping(uint256 => Game) public games;

    event GameCreated(
        uint256 gameId,
        address indexed challenger,
        address indexed challengee
    );
    event GameUpdated(uint256 gameId);
    event AssertionFailed(string message);

    uint256 constant public MIN_STAKE = 25_000_000_000_000_000_000;
    uint256 constant public FULL_STEP_COUNT = 10;

    uint256 constant STATE_EMPTY = 0;
    uint256 constant STATE_CHALLENGE = 1;
    uint256 constant STATE_SHOOT_STEP_COMMITMENTS = 2;
    uint256 constant STATE_SHOOT_STEP_REVEALS = 3;
    uint256 constant STATE_SHOOT = 4;
    uint256 constant STATE_BATTLE_CHOICE_COMMITMENTS = 5;
    uint256 constant STATE_BATTLE_CHOICE_REVEALS = 6;
    uint256 constant STATE_BATTLE = 7;

    uint256 constant UNSET = type(uint256).max;

    constructor(
        address _owner,
        ERC20 _lordsToken,
        uint256 _timeout
    ) {
        owner = _owner;
        lordsToken = _lordsToken;
        timeout = _timeout;
    }

    function challenge(uint256 stake, address challengee) external {
        require(stake >= MIN_STAKE, "Stake is too low");
        lordsToken.transferFrom(msg.sender, address(this), stake);

        uint256 gameId = nextGameId;
        nextGameId++;

        games[gameId] = Game({
            state: STATE_CHALLENGE,
            activityDeadline: block.timestamp + timeout,
            stake: stake,
            player1: PlayerGameData({
                addr: msg.sender,
                shootStepCommitment: bytes32(UNSET),
                shootStep: UNSET,
                battleChoiceCommitment: bytes32(UNSET),
                battleChoice: UNSET
            }),
            player2: PlayerGameData({
                addr: challengee,
                shootStepCommitment: bytes32(UNSET),
                shootStep: UNSET,
                battleChoiceCommitment: bytes32(UNSET),
                battleChoice: UNSET
            })
        });

        emit GameCreated(gameId, msg.sender, challengee);
    }

    function cleanUpTimedOutGame(uint256 gameId) external {
        Game storage game = games[gameId];
        requireTimedOut(game);

        require(game.state != STATE_EMPTY, "Game does not exist");

        uint256 winner = 0;

        if (game.state == STATE_CHALLENGE) {
            winner = 1;
        } else if (game.state == STATE_SHOOT_STEP_COMMITMENTS) {
            winner = calculateWinner(
                uint256(game.player1.shootStepCommitment),
                uint256(game.player2.shootStepCommitment)
            );
        } else if (game.state == STATE_SHOOT_STEP_REVEALS) {
            winner = calculateWinner(
                game.player1.shootStep,
                game.player2.shootStep
            );
        } else if (game.state == STATE_SHOOT) {
            winner = 0;
        } else if (game.state == STATE_BATTLE_CHOICE_COMMITMENTS) {
            winner = calculateWinner(
                uint256(game.player1.battleChoiceCommitment),
                uint256(game.player2.battleChoiceCommitment)
            );
        } else if (game.state == STATE_BATTLE_CHOICE_REVEALS) {
            winner = calculateWinner(
                game.player1.battleChoice,
                game.player2.battleChoice
            );
        } else if (game.state == STATE_BATTLE) {
            winner = 0;
        } else {
            revert("Unexpected state");
        }

        // TODO: Dishonor the player(s) who timed out

        if (winner == 0) {
            uint256 p2Stake = game.stake / 2; // P2 is rounded down
            uint256 p1Stake = game.stake - p2Stake;
            lordsToken.transfer(game.player1.addr, p1Stake);
            lordsToken.transfer(game.player2.addr, p2Stake);
        } else if (winner == 1) {
            lordsToken.transfer(game.player1.addr, game.stake);
        } else if (winner == 2) {
            lordsToken.transfer(game.player2.addr, game.stake);
        }

        delete games[gameId];
    }

    function calculateWinner(
        uint256 p1Value,
        uint256 p2Value
    ) internal returns (uint256) {
        if (p1Value == UNSET && p2Value == UNSET) {
            return 0;
        }

        if (p1Value == UNSET) {
            return 2;
        }

        if (p2Value == UNSET) {
            return 1;
        }

        emit AssertionFailed("State should have progressed");

        return 0;
    }

    function acceptChallenge(uint256 gameId) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == STATE_CHALLENGE,
            "Game is not in challenge state"
        );
        require(
            game.player2.addr == msg.sender,
            "Only challengee can accept challenge"
        );

        lordsToken.transferFrom(msg.sender, address(this), game.stake);
        game.stake += game.stake;

        uint256 fee = max(MIN_STAKE, game.stake / 100);
        lordsToken.transfer(owner, fee);
        game.stake -= fee;

        game.state = STATE_SHOOT_STEP_COMMITMENTS;
        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function commitShootStep(uint256 gameId, bytes32 commitment) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == STATE_SHOOT_STEP_COMMITMENTS,
            "Game is not in shoot step commitments state"
        );
        require(
            commitment != bytes32(UNSET),
            "Commitment cannot be UNSET"
        );

        if (msg.sender == game.player1.addr) {
            require(
                game.player1.shootStepCommitment != bytes32(UNSET),
                "Player 1 has already committed"
            );

            game.player1.shootStepCommitment = commitment;
        } else if (msg.sender == game.player2.addr) {
            require(
                game.player2.shootStepCommitment != bytes32(UNSET),
                "Player 2 has already committed"
            );

            game.player2.shootStepCommitment = commitment;
        } else {
            revert("Only players can submit shoot step commitments");
        }

        if (
            game.player1.shootStepCommitment != bytes32(UNSET) &&
            game.player2.shootStepCommitment != bytes32(UNSET)
        ) {
            game.state = STATE_SHOOT_STEP_REVEALS;
        }

        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function revealShootStep(uint256 gameId, uint256 salt, uint256 shootStep) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == STATE_SHOOT_STEP_REVEALS,
            "Game is not in shoot step reveals state"
        );
        require(
            1 <= shootStep && shootStep <= FULL_STEP_COUNT,
            "shootStep must be between 1 and FULL_STEP_COUNT inclusive"
        );

        if (msg.sender == game.player1.addr) {
            require(
                game.player1.shootStep != UNSET,
                "Player 1 has already revealed"
            );

            require(
                keccak256(abi.encodePacked(salt, shootStep))
                    == game.player1.shootStepCommitment,
                "Shoot step does not match commitment"
            );

            game.player1.shootStep = shootStep;
        } else if (msg.sender == game.player2.addr) {
            require(
                game.player2.shootStep != UNSET,
                "Player 2 has already revealed"
            );

            require(
                keccak256(abi.encodePacked(salt, shootStep))
                    == game.player2.shootStepCommitment,
                "Shoot step does not match commitment"
            );

            game.player2.shootStep = shootStep;
        } else {
            revert("Only players can submit shoot step reveals");
        }

        if (
            game.player1.shootStep != UNSET &&
            game.player2.shootStep != UNSET
        ) {
            game.state = STATE_SHOOT;
        }

        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function requireNotTimedOut(Game storage game) internal view {
        require(
            block.timestamp < game.activityDeadline,
            "Game has timed out"
        );
    }

    function requireTimedOut(Game storage game) internal view {
        require(
            block.timestamp >= game.activityDeadline,
            "Game has not timed out"
        );
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
}
