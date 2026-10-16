export type Coffee = {
  id: string;
  name: string;
  flavorDescription: string;
  flavorKeywords: string[];
  quantity: number;
  isBones: boolean;
  isOpen: boolean;
  isLow: boolean;
  updatedAt: string;
};

export const coffeeData: Coffee[] = [];