//index
import React, { createContext, useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

import { initializeSettings } from './script/storage'; //저장 불러오기

//AI, 언어, TTS, openaiAPI
import stt from './pages/1.stt/stt.tsx';
import stt_output from './pages/1.stt/stt_output.tsx';

import itt from './pages/2.itt/itt.tsx';
import camera from './pages/2.itt/camera.tsx';
import prompt1 from './pages/2.itt/prompt1.tsx';
import prompt2 from './pages/2.itt/prompt2.tsx';
import prompt3 from './pages/2.itt/prompt3.tsx';
import prompt4 from './pages/2.itt/prompt4.tsx';
import stt_record from './pages/1.stt/stt_record.tsx';
import itt_record from './pages/2.itt/itt_record.tsx';
import itt_output from './pages/2.itt/itt_output.tsx';

import api from './pages/3.api/api.tsx';
import input_api from './pages/3.api/input_api.tsx';

// 컨텍스트 생성
export const MyContext = createContext();
const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initializeSettings();
  }, []);

  return (
    <GestureHandlerRootView>
      <NavigationContainer independent={true}
        theme={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: '#FFFBE6', //바탕색 연한 크림 옐로우
          },
        }}>
        <Stack.Navigator
          initialRouteName="stt"
          screenOptions={{
              headerShown: false,
          }}>
            <Stack.Screen name="stt" component={stt}/>
            <Stack.Screen name="stt_output" component={stt_output}/>

            <Stack.Screen name="itt" component={itt}/>
            <Stack.Screen name="camera" component={camera}/>
            <Stack.Screen name="prompt1" component={prompt1}/>
            <Stack.Screen name="prompt2" component={prompt2}/>
            <Stack.Screen name="prompt3" component={prompt3}/>
            <Stack.Screen name="prompt4" component={prompt4}/>
            <Stack.Screen name="stt_record" component={stt_record}/>
            <Stack.Screen name="itt_record" component={itt_record}/>
            <Stack.Screen name="itt_output" component={itt_output}/>
            
            <Stack.Screen name="api" component={api}/>
            <Stack.Screen name="input_api" component={input_api}/>


        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}