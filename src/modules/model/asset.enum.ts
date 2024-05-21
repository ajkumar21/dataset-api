export enum Asset {
  BTC = 'bitcoin',
  ETH = 'ethereum',
}

export enum Frequency {
  hourly = 'h1',
  daily = 'd1',
  monthly = 'm1',
}

export type assetCombinationValue = {
  name: string;
  symbol: string;
  frequencies: Frequency[];
};

export const assetCombinationMap = new Map<Asset, assetCombinationValue>([
  [
    Asset.BTC,
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      frequencies: [Frequency.hourly, Frequency.daily, Frequency.monthly],
    },
  ],
  [
    Asset.ETH,
    { name: 'Ethereum', symbol: 'ETH', frequencies: [Frequency.daily] },
  ],
]);

type FrequencyInfo = {
  frequency: Frequency;
  expiryDate?: Date;
};

export type DataSet = {
  symbol: Asset;
  frequencyInfo: FrequencyInfo[];
};

export type RequestDataSet = {
  symbol: Asset;
  frequencyInfo: { frequency: Frequency; expiryDate?: Date };
};
