# Autonomous Car Experiment
This is a genetic algorithm experiment. My goal was to simulate an autonomous car that could go around a dynamic track.
---
![car](https://user-images.githubusercontent.com/70852167/235879832-864aca59-df13-457a-84c6-d3a5373ea4b1.gif)
## How it works
At first, a car is spawned with a neural network attached to it. This network is initialized with random weights and biases that will in turn cause the car to behave randomly. When the car dies i.e. hits the road borders, a new car is spawned with a
**slightly mutated** version of the previous car's neural network. This mutation causes the new car to develop new behaviours. To speed up learning, I stored the previous best performing neural network and compared it to the current neural network by
calculating the car's **fitness**. The fitness value determines how good the car is currently performing (see [here](https://github.com/rashadaziz/autonomous-car/blob/master/src/backend/calculate-fitness.ts) for more details). If the current car dies
before reaching a better fitness level than the previous best performing neural network, then the next car is spawned using the previous best neural network rather than the one from the car that just died. This process is repeated over and over again
until an optimal neural network is found.

## How to try out this project
1. Clone this repository using `git clone https://github.com/rashadaziz/autonomous-car.git`
2. Make sure you have [Node.js](https://nodejs.org/en) installed.
3. Open your terminal in the directory you cloned this repository in.
4. Type `npm i` to install the project's dependencies.
5. Type `npm run dev` to run the project using (Vite)[https://vitejs.dev/]
6. Open `http://localhost:5173/` in your browser.
---
**Credits to: https://github.com/gniziemazity and the creators of Paper.js**
