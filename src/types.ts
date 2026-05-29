/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProblemType = 'STRING_MATCH' | 'TSP';

export type SelectionMethod = 'TOURNAMENT' | 'ROULETTE' | 'ELITISM';

export interface GAParameters {
  populationSize: number;
  mutationRate: number; // e.g., 0.01 for 1%
  crossoverRate: number; // e.g., 0.8 for 80%
  selectionMethod: SelectionMethod;
  elitismCount: number; // Number of top individuals kept automatically
}

// Representing an individual in String Evolving problem
export interface StringIndividual {
  genes: string;
  fitness: number;
}

// Coord of cities in TSP problem
export interface City {
  id: number;
  x: number; // Percentage 0 - 100 on canvas
  y: number; // Percentage 0 - 100 on canvas
  name: string;
}

// Representing an individual in Traveling Salesperson Problem (TSP)
export interface TspIndividual {
  genes: number[]; // Indices of cities in order of visit
  fitness: number; // 1 / total Distance
  distance: number; // total path distance
}

// History point for charts
export interface GenerationHistory {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  bestValue: string | number; // Best phrase or Shortest distance
}
