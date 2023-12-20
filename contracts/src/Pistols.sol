// SPDX-License-Identifier: CC0
pragma solidity ^0.8.13;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {PistolsLib as Lib} from "./PistolsLib.sol";

// TODO: Move structs to lib
struct PlayerGameData {
    address addr;

    bytes32 shootStepCommitment;
    uint256 shootStep;

    bytes32 battleChoiceCommitment;
    uint256 battleChoice;

    int256 health;
}

struct Game {
    uint256 state;
    uint256 stake;
    uint256 activityDeadline;
    bytes32 rand;

    PlayerGameData player1;
    PlayerGameData player2;
}

struct PlayerStats {
    bool init;
    uint256 wins;
    uint256 losses;
    uint256 draws;
    uint256 dishonors;
}

contract Pistols {
    address public owner;
    ERC20 public lordsToken;

    uint256 public timeout;

    uint256 public nextGameId = 0;
    mapping(uint256 => Game) games;
    mapping(address => PlayerStats) public allPlayerStats;

    event GameCreated(
        uint256 gameId,
        address indexed challenger,
        address indexed challengee
    );
    event GameUpdated(uint256 gameId);
    event AssertionFailed(string message);
    event Dishonor(uint256 gameId, address indexed player);

    constructor(
        address _owner,
        ERC20 _lordsToken,
        uint256 _timeout
    ) {
        owner = _owner;
        lordsToken = _lordsToken;
        timeout = _timeout;
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getPlayerStats(
        address player
    ) external view returns (PlayerStats memory) {
        return allPlayerStats[player];
    }

    function challenge(
        uint256 stake,
        address challengee
    ) external returns  (uint256) {
        require(stake >= Lib.MIN_STAKE, "Stake is too low");
        lordsToken.transferFrom(msg.sender, address(this), stake);

        uint256 gameId = nextGameId;
        nextGameId++;

        games[gameId] = Game({
            state: Lib.STATE_CHALLENGE,
            activityDeadline: block.timestamp + timeout,
            stake: stake,
            rand: 0,
            player1: PlayerGameData({
                addr: msg.sender,
                shootStepCommitment: bytes32(Lib.UNSET),
                shootStep: Lib.UNSET,
                battleChoiceCommitment: bytes32(Lib.UNSET),
                battleChoice: Lib.UNSET,
                health: 2
            }),
            player2: PlayerGameData({
                addr: challengee,
                shootStepCommitment: bytes32(Lib.UNSET),
                shootStep: Lib.UNSET,
                battleChoiceCommitment: bytes32(Lib.UNSET),
                battleChoice: Lib.UNSET,
                health: 2
            })
        });

        emit GameCreated(gameId, msg.sender, challengee);
        return gameId;
    }

    function acceptChallenge(uint256 gameId) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == Lib.STATE_CHALLENGE,
            "Game is not in challenge state"
        );
        require(
            game.player2.addr == msg.sender,
            "Only challengee can accept challenge"
        );

        lordsToken.transferFrom(msg.sender, address(this), game.stake);
        game.stake += game.stake;

        uint256 fee = max(Lib.MIN_STAKE, game.stake / 100);
        lordsToken.transfer(owner, fee);
        game.stake -= fee;

        // TODO: Initialization may not be necessary (zeros are automatic).
        // Check this.

        if (!allPlayerStats[game.player1.addr].init) {
            allPlayerStats[game.player1.addr] = PlayerStats({
                init: true,
                wins: 0,
                losses: 0,
                draws: 0,
                dishonors: 0
            });
        }

        if (!allPlayerStats[game.player2.addr].init) {
            allPlayerStats[game.player2.addr] = PlayerStats({
                init: true,
                wins: 0,
                losses: 0,
                draws: 0,
                dishonors: 0
            });
        }

        game.state = Lib.STATE_SHOOT_STEP_COMMITMENTS;
        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function commitShootStep(uint256 gameId, bytes32 commitment) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == Lib.STATE_SHOOT_STEP_COMMITMENTS,
            "Game is not in shoot step commitments state"
        );
        require(
            commitment != bytes32(Lib.UNSET),
            "Commitment cannot be UNSET"
        );

        if (msg.sender == game.player1.addr) {
            require(
                game.player1.shootStepCommitment == bytes32(Lib.UNSET),
                "Player 1 has already committed"
            );

            game.player1.shootStepCommitment = commitment;
        } else if (msg.sender == game.player2.addr) {
            require(
                game.player2.shootStepCommitment == bytes32(Lib.UNSET),
                "Player 2 has already committed"
            );

            game.player2.shootStepCommitment = commitment;
        } else {
            revert("Only players can submit shoot step commitments");
        }

        if (
            game.player1.shootStepCommitment != bytes32(Lib.UNSET) &&
            game.player2.shootStepCommitment != bytes32(Lib.UNSET)
        ) {
            game.state = Lib.STATE_SHOOT_STEP_REVEALS;
        }

        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function revealShootStep(
        uint256 gameId,
        bytes32 salt,
        uint256 shootStep
    ) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == Lib.STATE_SHOOT_STEP_REVEALS,
            "Game is not in shoot step reveals state"
        );
        require(
            1 <= shootStep && shootStep <= Lib.FULL_STEP_COUNT,
            "shootStep must be between 1 and FULL_STEP_COUNT inclusive"
        );

        if (msg.sender == game.player1.addr) {
            require(
                game.player1.shootStep == Lib.UNSET,
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
                game.player2.shootStep == Lib.UNSET,
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

        game.rand |= salt;

        if (
            game.player1.shootStep != Lib.UNSET &&
            game.player2.shootStep != Lib.UNSET
        ) {
            game.state = Lib.STATE_SHOOT;
        }

        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function shootout(uint256 gameId) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == Lib.STATE_SHOOT,
            "Game is not in shoot state"
        );

        uint256 p1ShootStep = game.player1.shootStep;
        uint256 p2ShootStep = game.player2.shootStep;

        if (
            p1ShootStep == Lib.FULL_STEP_COUNT &&
            p2ShootStep == Lib.FULL_STEP_COUNT
        ) {
            bool p2Killed = chance(20, 100, game.rand, "p1 shot");
            bool p1Killed = chance(20, 100, game.rand, "p2 shot");

            if (p1Killed && p2Killed) {
                finishGame(gameId, game, Lib.OUTCOME_DRAW);
                return;
            }

            if (p1Killed) {
                finishGame(gameId, game, Lib.OUTCOME_P2_WIN);
                return;
            }

            if (p2Killed) {
                finishGame(gameId, game, Lib.OUTCOME_P1_WIN);
                return;
            }
        } else {
            if (
                p1ShootStep <= p2ShootStep &&
                chance(p1ShootStep, 10, game.rand, "p1 shot")
            ) {
                emit Dishonor(gameId, game.player1.addr);
                allPlayerStats[game.player1.addr].dishonors++;
                game.player2.health--;
            }

            if (
                p2ShootStep <= p1ShootStep &&
                chance(p2ShootStep, 10, game.rand, "p2 shot")
            ) {
                emit Dishonor(gameId, game.player2.addr);
                allPlayerStats[game.player2.addr].dishonors++;
                game.player1.health--;
            }
        }

        game.state = Lib.STATE_BATTLE_CHOICE_COMMITMENTS;

        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function commitBattleChoice(uint256 gameId, bytes32 commitment) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == Lib.STATE_BATTLE_CHOICE_COMMITMENTS,
            "Game is not in battle choice commitments state"
        );
        require(
            commitment != bytes32(Lib.UNSET),
            "Commitment cannot be UNSET"
        );

        if (msg.sender == game.player1.addr) {
            require(
                game.player1.battleChoiceCommitment == bytes32(Lib.UNSET),
                "Player 1 has already committed"
            );

            game.player1.battleChoiceCommitment = commitment;
        } else if (msg.sender == game.player2.addr) {
            require(
                game.player2.battleChoiceCommitment == bytes32(Lib.UNSET),
                "Player 2 has already committed"
            );

            game.player2.battleChoiceCommitment = commitment;
        } else {
            revert("Only players can submit battle choice commitments");
        }

        if (
            game.player1.battleChoiceCommitment != bytes32(Lib.UNSET) &&
            game.player2.battleChoiceCommitment != bytes32(Lib.UNSET)
        ) {
            game.state = Lib.STATE_BATTLE_CHOICE_REVEALS;
        }

        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function revealBattleChoice(
        uint256 gameId,
        bytes32 salt,
        uint256 battleChoice
    ) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == Lib.STATE_BATTLE_CHOICE_REVEALS,
            "Game is not in battle choice reveals state"
        );
        require(
            battleChoice == Lib.BATTLE_CHOICE_LIGHT_HIT ||
            battleChoice == Lib.BATTLE_CHOICE_HEAVY_HIT ||
            battleChoice == Lib.BATTLE_CHOICE_BLOCK,
            "battleChoice must be a valid choice"
        );

        if (msg.sender == game.player1.addr) {
            require(
                game.player1.battleChoice == Lib.UNSET,
                "Player 1 has already revealed"
            );

            require(
                keccak256(abi.encodePacked(salt, battleChoice))
                    == game.player1.battleChoiceCommitment,
                "Battle choice does not match commitment"
            );

            game.player1.battleChoice = battleChoice;
        } else if (msg.sender == game.player2.addr) {
            require(
                game.player2.battleChoice == Lib.UNSET,
                "Player 2 has already revealed"
            );

            require(
                keccak256(abi.encodePacked(salt, battleChoice))
                    == game.player2.battleChoiceCommitment,
                "Battle choice does not match commitment"
            );

            game.player2.battleChoice = battleChoice;
        } else {
            revert("Only players can submit battle choice reveals");
        }

        game.rand |= salt;

        if (
            game.player1.battleChoice != Lib.UNSET &&
            game.player2.battleChoice != Lib.UNSET
        ) {
            game.state = Lib.STATE_BATTLE;
        }

        game.activityDeadline = block.timestamp + timeout;
        emit GameUpdated(gameId);
    }

    function battle(uint256 gameId) external {
        Game storage game = games[gameId];
        requireNotTimedOut(game);

        require(
            game.state == Lib.STATE_BATTLE,
            "Game is not in battle state"
        );

        uint256 p1BattleChoice = game.player1.battleChoice;
        uint256 p2BattleChoice = game.player2.battleChoice;

        if (p1BattleChoice == Lib.BATTLE_CHOICE_LIGHT_HIT) {
            if (p2BattleChoice == Lib.BATTLE_CHOICE_LIGHT_HIT) {
                game.player1.health--;
                game.player2.health--;
            } else if (p2BattleChoice == Lib.BATTLE_CHOICE_HEAVY_HIT) {
                game.player2.health--;

                if (game.player2.health > 0) {
                    game.player1.health -= 2;
                }
            } else if (p2BattleChoice == Lib.BATTLE_CHOICE_BLOCK) {
                // Nothing (successful block)
            }
        } else if (p1BattleChoice == Lib.BATTLE_CHOICE_HEAVY_HIT) {
            if (p2BattleChoice == Lib.BATTLE_CHOICE_LIGHT_HIT) {
                game.player1.health--;

                if (game.player1.health > 0) {
                    game.player2.health -= 2;
                }
            } else if (p2BattleChoice == Lib.BATTLE_CHOICE_HEAVY_HIT) {
                game.player1.health -= 2;
                game.player2.health -= 2;
            } else if (p2BattleChoice == Lib.BATTLE_CHOICE_BLOCK) {
                game.player2.health -= 2;
            }
        } else if (p1BattleChoice == Lib.BATTLE_CHOICE_BLOCK) {
            if (p2BattleChoice == Lib.BATTLE_CHOICE_LIGHT_HIT) {
                // Nothing (successful block)
            } else if (p2BattleChoice == Lib.BATTLE_CHOICE_HEAVY_HIT) {
                game.player1.health -= 2;
            } else if (p2BattleChoice == Lib.BATTLE_CHOICE_BLOCK) {
                // Nothing
            }
        }

        uint256 outcome;

        if (game.player1.health <= 0 && game.player2.health <= 0) {
            outcome = Lib.OUTCOME_DRAW;
        } else if (game.player1.health <= 0) {
            outcome = Lib.OUTCOME_P2_WIN;
        } else if (game.player2.health <= 0) {
            outcome = Lib.OUTCOME_P1_WIN;
        } else {
            outcome = Lib.OUTCOME_DRAW;
        }

        finishGame(gameId, game, outcome);
    }

    function finishGame(
        uint256 gameId,
        Game storage game,
        uint256 outcome
    ) internal {
        if (outcome == Lib.OUTCOME_DRAW) {
            uint256 p2Stake = game.stake / 2; // P2 is rounded down
            uint256 p1Stake = game.stake - p2Stake;

            lordsToken.transfer(game.player1.addr, p1Stake);
            lordsToken.transfer(game.player2.addr, p2Stake);

            allPlayerStats[game.player1.addr].draws++;
            allPlayerStats[game.player2.addr].draws++;
        } else if (outcome == Lib.OUTCOME_P1_WIN) {
            lordsToken.transfer(game.player1.addr, game.stake);

            allPlayerStats[game.player1.addr].wins++;
            allPlayerStats[game.player2.addr].losses++;
        } else if (outcome == Lib.OUTCOME_P2_WIN) {
            lordsToken.transfer(game.player2.addr, game.stake);

            allPlayerStats[game.player2.addr].wins++;
            allPlayerStats[game.player1.addr].losses++;
        }

        delete games[gameId];
        emit GameUpdated(gameId);
    }

    function finishTimedOutGame(uint256 gameId) external {
        Game storage game = games[gameId];
        requireTimedOut(game);

        require(game.state != Lib.STATE_EMPTY, "Game does not exist");

        uint256 outcome;

        if (game.state == Lib.STATE_CHALLENGE) {
            outcome = Lib.OUTCOME_P1_WIN;
        } else if (game.state == Lib.STATE_SHOOT_STEP_COMMITMENTS) {
            outcome = calculateOutcome(
                uint256(game.player1.shootStepCommitment),
                uint256(game.player2.shootStepCommitment)
            );
        } else if (game.state == Lib.STATE_SHOOT_STEP_REVEALS) {
            outcome = calculateOutcome(
                game.player1.shootStep,
                game.player2.shootStep
            );
        } else if (game.state == Lib.STATE_SHOOT) {
            outcome = Lib.OUTCOME_DRAW;
        } else if (game.state == Lib.STATE_BATTLE_CHOICE_COMMITMENTS) {
            outcome = calculateOutcome(
                uint256(game.player1.battleChoiceCommitment),
                uint256(game.player2.battleChoiceCommitment)
            );
        } else if (game.state == Lib.STATE_BATTLE_CHOICE_REVEALS) {
            outcome = calculateOutcome(
                game.player1.battleChoice,
                game.player2.battleChoice
            );
        } else if (game.state == Lib.STATE_BATTLE) {
            outcome = Lib.OUTCOME_DRAW;
        } else {
            revert("Unexpected state");
        }

        if (outcome == 1) {
            emit Dishonor(gameId, game.player2.addr);
        } else if (outcome == 2) {
            emit Dishonor(gameId, game.player1.addr);
        }

        finishGame(gameId, game, outcome);
    }

    function calculateOutcome(
        uint256 p1Value,
        uint256 p2Value
    ) internal returns (uint256) {
        if (p1Value == Lib.UNSET && p2Value == Lib.UNSET) {
            return Lib.OUTCOME_DRAW;
        }

        if (p1Value == Lib.UNSET) {
            return Lib.OUTCOME_P2_WIN;
        }

        if (p2Value == Lib.UNSET) {
            return Lib.OUTCOME_P1_WIN;
        }

        emit AssertionFailed("State should have progressed");

        return Lib.OUTCOME_DRAW;
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

    function chance(
        uint256 numerator,
        uint256 denominator,
        bytes32 rand,
        string memory seed
    ) public pure returns (bool) {
        uint256 randHash = uint256(keccak256(abi.encodePacked(rand, seed)));
        return randHash % denominator < numerator;
    }
}
