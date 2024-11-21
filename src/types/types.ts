export interface GameData {
  Rank: number;
  Name: string;
  Platform: string;
  Year: number;
  Genre: string;
  Publisher: string;
  NA_Sales: number;
  EU_Sales: number;
  JP_Sales: number;
  Other_Sales: number;
  Global_Sales: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface SalesByYear {
  year: number;
  sales: number;
}
