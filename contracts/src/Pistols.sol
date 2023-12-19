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
    ERC20 public token;

    uint256 public feeNumerator;
    uint256 public constant FEE_DENOMINATOR = 10_000;

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

    uint256 constant STATE_EMPTY = 0;
    uint256 constant STATE_CHALLENGE = 1;
    uint256 constant STATE_SHOOT_STEP_COMMITMENTS = 2;
    uint256 constant STATE_SHOOT_STEP_REVEALS = 3;
    uint256 constant STATE_BATTLE_CHOICE_COMMITMENTS = 4;
    uint256 constant STATE_BATTLE_CHOICE_REVEALS = 5;

    uint256 constant UNSET = type(uint256).max;

    constructor(
        address _owner,
        ERC20 _token,
        uint256 _feeNumerator,
        uint256 _timeout
    ) {
        owner = _owner;
        token = _token;
        feeNumerator = _feeNumerator;
        timeout = _timeout;
    }

    function challenge(uint256 stake, address challengee) external {
        token.transferFrom(msg.sender, address(this), stake);

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
        } else {
            revert("Unexpected state");
        }

        if (winner == 0) {
            uint256 p2Stake = game.stake / 2; // P2 is rounded down
            uint256 p1Stake = game.stake - p2Stake;
            token.transfer(game.player1.addr, p1Stake);
            token.transfer(game.player2.addr, p2Stake);
        } else if (winner == 1) {
            token.transfer(game.player1.addr, game.stake);
        } else if (winner == 2) {
            token.transfer(game.player2.addr, game.stake);
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

        token.transferFrom(msg.sender, address(this), game.stake);
        game.stake += game.stake;

        uint256 fee = feeNumerator * (game.stake  / FEE_DENOMINATOR);
        token.transfer(owner, fee);
        game.stake -= fee;

        game.state = STATE_SHOOT_STEP_COMMITMENTS;
        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function submitShootStepCommitment(
        uint256 gameId,
        bytes32 commitment
    ) external {
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
            game.player1.shootStepCommitment = commitment;
        } else if (msg.sender == game.player2.addr) {
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
}
