# NFL Predictions

An interactive NFL prediction platform where users make weekly game picks, track their accuracy throughout the season, and compare their predictions against an AI model. Explore matchup insights, follow game results, and see how your picks stack up against the AI.

## Features

### 🏈 User Predictions
- Make and save predictions for NFL matchups throughout the season.
- Track your picks as games are completed.
- Compare your predictions against actual game results.
- Monitor your season record and prediction accuracy.

### 🤖 AI Insights
- View AI-generated predictions for NFL matchups.
- Explore projected winners and estimated win probabilities.
- Understand why the model favors a team through matchup-specific explanations.
- Compare your picks directly against the AI's predictions.
- Review the model's methodology and the factors used to generate predictions.

### 📊 Results & Standings
- Follow completed and live NFL games.
- Track prediction performance as results become available.
- View standings and compare performance across the season.

### 🔄 Dynamic Data
- Retrieve game results and schedules from ESPN data sources.
- Update prediction records as games finish.
- Keep user predictions separate from AI projections so performance can be evaluated independently.

### 👤 User Accounts
- Sign in to access your account.
- Save and retrieve your personal predictions.
- Track your individual performance throughout the season.

## How It Works

1. **Choose a matchup:** Browse NFL games and select your predicted winner.
2. **Make your pick:** Save your prediction for the matchup.
3. **Check the AI:** View the model's projected winner, win probability, and available explanation.
4. **Compare results:** Once the game finishes, see whether you and the AI predicted the winner correctly.
5. **Track your performance:** Follow your record and season-long accuracy as more games are completed.

## Technology Stack

The project uses a separate frontend and backend, with a machine-learning pipeline supporting AI predictions.

- **Frontend:** React, JavaScript, and Vite
- **Backend:** Python and Flask
- **Machine Learning:** Python-based model training, feature engineering, prediction evaluation, and probability generation
- **Data Sources:** ESPN game data and locally generated model projections
- **Deployment:** Vercel for the frontend and Render for the backend

*Technology details should be adjusted if the current implementation differs.*

## Project Structure

The application is organized into separate repositories:

- **NFL-Prediction-Frontend:** User interface, matchup selection, user picks, AI Insight dashboard, and results display.
- **NFL-Prediction-Backend:** API endpoints, prediction data, user-related functionality, and game result integration.
- **ML Backend:** Model training, feature engineering, evaluation, and projection generation.

## Prediction Methodology

The AI model evaluates available pregame information to estimate the probability of each team winning. Predictions are generated using the model's selected features and parameters, with the goal of producing useful matchup forecasts.

The AI Insight section provides the model's predicted winner, estimated win probability, and available explanation of the factors supporting the prediction. Model performance is evaluated against completed games.

Predictions are estimates, not guarantees. Historical accuracy can differ from future performance, and the model's results depend on data availability and model validation.

## Project Goals

- Build an interactive platform for NFL prediction tracking.
- Help users evaluate their own football predictions against an AI model.
- Present machine-learning predictions in an understandable format.
- Track model performance transparently over the course of the season.
- Improve prediction quality through data analysis and model evaluation.

## Disclaimer

This project is intended for sports analysis, prediction tracking, and educational purposes. AI-generated predictions are estimates and should not be interpreted as guaranteed outcomes.

## Author

Developed as an independent project combining NFL analytics, software development, and machine learning.
