import React, { createContext, useContext, useState, ReactNode } from 'react';

const INITIAL_NODES = [
  "variables_and_data_types", "arrays", "loops", "linear_search", 
  "sorted_arrays", "binary_search", "divide_and_conquer", "basic_sorting", 
  "merge_sort", "recursion", "base_case_and_recursive_case", "stacks", 
  "big_o_time_complexity", "trees_intro", "tree_traversal"
];

export interface AppState {
  mastery: Record<string, number>;
  history: string[];
}

interface MasteryContextType {
  state: AppState;
  updateMastery: (nodeId: string, score: number) => void;
}

const defaultMastery = INITIAL_NODES.reduce((acc, node) => {
  acc[node] = 0.0;
  return acc;
}, {} as Record<string, number>);

const MasteryContext = createContext<MasteryContextType | undefined>(undefined);

export function MasteryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    mastery: defaultMastery,
    history: []
  });

  const updateMastery = (nodeId: string, score: number) => {
    setState(prev => {
      const currentScore = prev.mastery[nodeId] || 0;
      const newScore = Math.max(currentScore, score);
      
      const newHistory = [...prev.history];
      if (!newHistory.includes(nodeId)) {
        newHistory.push(nodeId);
      }
      
      return {
        mastery: {
          ...prev.mastery,
          [nodeId]: newScore
        },
        history: newHistory
      };
    });
  };

  return (
    <MasteryContext.Provider value={{ state, updateMastery }}>
      {children}
    </MasteryContext.Provider>
  );
}

export function useMasteryContext() {
  const context = useContext(MasteryContext);
  if (context === undefined) {
    throw new Error('useMasteryContext must be used within a MasteryProvider');
  }
  return context;
}
