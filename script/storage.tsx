// storage.js
import AsyncStorage from '@react-native-async-storage/async-storage'; //일시적

export const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("저장 실패:", e);
  }
};

export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value != null ? JSON.parse(value) : null;
  } catch (e) {
    console.error("불러오기 실패:", e);
    return null;
  }
};

// 초기 설정 함수
export const initializeSettings = async () => {
  const api = await getData("api");
};