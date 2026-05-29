/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GAParameters, StringIndividual, City, TspIndividual } from '../types';

// The alphabet of allowed characters for string evolving, including Vietnamese accents
export const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.!?-ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỶỷỸỹÝý";

/**
 * --- STRING MATCH SECTOR ---
 */

// Generate a random character from the alphabet
export function getRandomChar(): string {
  const index = Math.floor(Math.random() * ALPHABET.length);
  return ALPHABET[index];
}

// Create a random string of target length
export function makeRandomString(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += getRandomChar();
  }
  return result;
}

// Calculate fitness of a string match individual
export function calculateStringFitness(genes: string, target: string): number {
  let matches = 0;
  for (let i = 0; i < target.length; i++) {
    if (genes[i] === target[i]) {
      matches++;
    }
  }
  // Prevent exact 0 fitness to avoid dividing by zero in Roulette Wheel
  return Math.max(0.0001, matches / target.length);
}

// Initialize string population
export function initStringPopulation(popSize: number, targetLength: number): StringIndividual[] {
  const population: StringIndividual[] = [];
  for (let i = 0; i < popSize; i++) {
    const genes = makeRandomString(targetLength);
    population.push({
      genes,
      fitness: 0 // Will evaluate later
    });
  }
  return population;
}

// Selection: Tournament
function selectTournament<T extends { fitness: number }>(population: T[], k: number = 5): T {
  let best: T | null = null;
  for (let i = 0; i < k; i++) {
    const ind = population[Math.floor(Math.random() * population.length)];
    if (!best || ind.fitness > best.fitness) {
      best = ind;
    }
  }
  return best!;
}

// Selection: Roulette Wheel
function selectRouletteWheel<T extends { fitness: number }>(population: T[]): T {
  let totalFitness = 0;
  for (let i = 0; i < population.length; i++) {
    totalFitness += population[i].fitness;
  }
  
  let r = Math.random() * totalFitness;
  for (let i = 0; i < population.length; i++) {
    r -= population[i].fitness;
    if (r <= 0) {
      return population[i];
    }
  }
  return population[population.length - 1];
}

// Single-point Crossover for strings
export function crossoverStrings(parent1: string, parent2: string, rate: number): string {
  if (Math.random() > rate) {
    return Math.random() > 0.5 ? parent1 : parent2;
  }
  const point = Math.floor(Math.random() * (parent1.length - 1)) + 1;
  return parent1.substring(0, point) + parent2.substring(point);
}

// Mutation for strings
export function mutateString(genes: string, rate: number): string {
  let mutated = '';
  for (let i = 0; i < genes.length; i++) {
    if (Math.random() < rate) {
      mutated += getRandomChar();
    } else {
      mutated += genes[i];
    }
  }
  return mutated;
}

// Run one generation of the String Matching GA
export function evolveStringPopulation(
  population: StringIndividual[],
  target: string,
  params: GAParameters
): StringIndividual[] {
  const nextPopulation: StringIndividual[] = [];
  const popSize = population.length;

  // 1. Evaluate fitness
  const evaluatedPop = population.map(ind => ({
    genes: ind.genes,
    fitness: calculateStringFitness(ind.genes, target)
  }));

  // Sort by fitness (descending)
  evaluatedPop.sort((a, b) => b.fitness - a.fitness);

  // 2. Elitism: directly copy top individuals
  const elitismCount = Math.min(params.elitismCount, popSize);
  for (let i = 0; i < elitismCount; i++) {
    nextPopulation.push({ ...evaluatedPop[i] });
  }

  // Helper selector depending on mode
  const selectParent = () => {
    if (params.selectionMethod === 'TOURNAMENT') {
      return selectTournament(evaluatedPop);
    } else if (params.selectionMethod === 'ROULETTE') {
      return selectRouletteWheel(evaluatedPop);
    } else {
      // ELITISM fallback: select from top 20%
      const limit = Math.max(1, Math.floor(popSize * 0.2));
      return evaluatedPop[Math.floor(Math.random() * limit)];
    }
  };

  // 3. Fill the rest of the generation with reproduction
  while (nextPopulation.length < popSize) {
    const parent1 = selectParent();
    const parent2 = selectParent();

    // Crossover
    let childGenes = crossoverStrings(parent1.genes, parent2.genes, params.crossoverRate);

    // Mutation
    childGenes = mutateString(childGenes, params.mutationRate);

    nextPopulation.push({
      genes: childGenes,
      fitness: calculateStringFitness(childGenes, target)
    });
  }

  return nextPopulation;
}


/**
 * --- TSP (TRAVELING SALESPERSON PROBLEM) SECTOR ---
 */

// Helper to calculate Euclidean distance between two cities
export function getDistance(c1: City, c2: City): number {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate the total tour distance
export function calculateTourDistance(tour: number[], cities: City[]): number {
  if (tour.length < 2) return 0;
  let dist = 0;
  for (let i = 0; i < tour.length; i++) {
    const c1 = cities[tour[i]];
    const c2 = cities[tour[(i + 1) % tour.length]]; // wrap around to first city
    dist += getDistance(c1, c2);
  }
  return dist;
}

// Generate random permutation of 0..N-1
export function shuffleArray(array: number[]): number[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Initialize TSP population
export function initTspPopulation(popSize: number, numCities: number): TspIndividual[] {
  const population: TspIndividual[] = [];
  const baseTour = Array.from({ length: numCities }, (_, i) => i);
  
  for (let i = 0; i < popSize; i++) {
    const tour = shuffleArray(baseTour);
    population.push({
      genes: tour,
      fitness: 0,
      distance: 0
    });
  }
  return population;
}

/**
 * Ordered Crossover (OX) for Permutation Chromosomes (TSP)
 * Avoids duplicate city visits and preserves path segments.
 */
export function crossoverTsp(parent1: number[], parent2: number[], rate: number): number[] {
  if (Math.random() > rate) {
    return Math.random() > 0.5 ? [...parent1] : [...parent2];
  }

  const length = parent1.length;
  const child = Array(length).fill(-1);

  // Pick two random crossover points
  const start = Math.floor(Math.random() * length);
  const end = Math.floor(Math.random() * length);

  const minPoint = Math.min(start, end);
  const maxPoint = Math.max(start, end);

  // Copy substring from parent 1 to child
  for (let i = minPoint; i <= maxPoint; i++) {
    child[i] = parent1[i];
  }

  // Slide through remaining items of parent 2 and fill child gaps
  let parentIndex = 0;
  for (let i = 0; i < length; i++) {
    if (child[i] === -1) {
      while (parentIndex < length && child.includes(parent2[parentIndex])) {
        parentIndex++;
      }
      if (parentIndex < length) {
        child[i] = parent2[parentIndex];
        parentIndex++;
      }
    }
  }

  return child;
}

/**
 * Mutation for TSP (Swap mutation: Swaps two random cities in the tour)
 */
export function mutateTsp(tour: number[], rate: number): number[] {
  const mutated = [...tour];
  if (Math.random() < rate) {
    const index1 = Math.floor(Math.random() * tour.length);
    let index2 = Math.floor(Math.random() * tour.length);
    while (index1 === index2 && tour.length > 1) {
      index2 = Math.floor(Math.random() * tour.length);
    }
    // Swap cities
    [mutated[index1], mutated[index2]] = [mutated[index2], mutated[index1]];
  }
  return mutated;
}

// Run one generation of the TSP GA
export function evolveTspPopulation(
  population: TspIndividual[],
  cities: City[],
  params: GAParameters
): TspIndividual[] {
  const popSize = population.length;
  
  // 1. Evaluate fitness
  const evaluatedPop = population.map(ind => {
    const distance = calculateTourDistance(ind.genes, cities);
    // Fitness is inverse of distance (scaled so it is easier to display)
    const fitness = distance > 0 ? 10000 / distance : 0.0001;
    return {
      genes: ind.genes,
      fitness,
      distance
    };
  });

  // Sort by fitness (descending, meaning smaller distance comes first)
  evaluatedPop.sort((a, b) => b.fitness - a.fitness);

  const nextPopulation: TspIndividual[] = [];

  // 2. Elitism: Keep top individuals
  const elitismCount = Math.min(params.elitismCount, popSize);
  for (let i = 0; i < elitismCount; i++) {
    nextPopulation.push({ ...evaluatedPop[i] });
  }

  // Selector helper
  const selectParent = () => {
    if (params.selectionMethod === 'TOURNAMENT') {
      return selectTournament(evaluatedPop);
    } else if (params.selectionMethod === 'ROULETTE') {
      return selectRouletteWheel(evaluatedPop);
    } else {
      const limit = Math.max(1, Math.floor(popSize * 0.2));
      return evaluatedPop[Math.floor(Math.random() * limit)];
    }
  };

  // 3. Reproduce secondary population
  while (nextPopulation.length < popSize) {
    const parent1 = selectParent();
    const parent2 = selectParent();

    // Crossover
    let childGenes = crossoverTsp(parent1.genes, parent2.genes, params.crossoverRate);

    // Mutation
    childGenes = mutateTsp(childGenes, params.mutationRate);

    const distance = calculateTourDistance(childGenes, cities);
    const fitness = distance > 0 ? 10000 / distance : 0.0001;

    nextPopulation.push({
      genes: childGenes,
      fitness,
      distance
    });
  }

  return nextPopulation;
}
