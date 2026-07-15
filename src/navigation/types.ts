import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Collection: undefined;
  Sites: undefined;
  Guide: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Camera: undefined;
  Details: undefined;
  SpecimenDetail: { specimenId: string };
  Account: undefined;
};
