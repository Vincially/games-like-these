import { GameService } from './service/GameService.js';
import { UserService } from './service/UserService.js';
import { TrainingService } from './service/TrainingService.js';

import { GameView } from './view/GameView.js';
import { UserView } from './view/UserView.js';
import { ModelTrainingView } from './view/ModelTrainingView.js';
import { TFVisorView } from './view/TFVisorView.js';

import { GameController } from './controller/GameController.js';
import { UserController } from './controller/UserController.js';
import { ModelTrainingController } from './controller/ModelTrainingController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { TrainingStreamController } from './controller/TrainingStreamController.js';

const gameService = new GameService();
const userService = new UserService();
const trainingService = new TrainingService();

const catalogView = new GameView('games-grid');
const recommendationsView = new GameView('recommendations-grid');
const userView = new UserView({
    selectId: 'user-select',
    ageFieldId: 'user-age',
    playedListId: 'played-games-list',
});
const modelTrainingView = new ModelTrainingView({
    trainButtonId: 'train-button',
    recommendButtonId: 'recommend-button',
    progressBarId: 'training-progress-bar',
    statusTextId: 'training-status',
});
const tfVisorView = new TFVisorView();

const gameController = new GameController(gameService, catalogView, recommendationsView);
const userController = new UserController(userService, userView);
new ModelTrainingController(modelTrainingView);
new TFVisorController(tfVisorView);
new TrainingStreamController(trainingService);

await Promise.all([gameController.init(), userController.init()]);
