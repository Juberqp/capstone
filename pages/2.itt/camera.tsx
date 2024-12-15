import React, { useRef, useState } from 'react';
import { View, Text, Image, Linking, Animated, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar'; 
import * as Speech from 'expo-speech'; 
import { CameraView, useCameraPermissions } from "expo-camera";

import { storeData, getData } from '../../script/storage'; //저장 불러오기

const { width, height } = Dimensions.get('window');

export default function Screen1({ navigation }) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const threshold = 10;

  // translateY 초기화
  const translateY = useRef(new Animated.Value(0)).current;

  const cameraRef = useRef(null);

  const text = '촬영을 하시려면 원하시는 방향으로 핸드폰을 돌리시고 화면을 클릭하세요.';

  const resetAnimation = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useFocusEffect(
    React.useCallback(() => {
      translateY.setValue(0);
      fadeAnim.setValue(1);
      Speech.speak(text, { language: 'ko' });
    }, [])
  );

  const handleGestureEnd = (event) => {
    if (event.nativeEvent.state === State.END) {
      setIsSwiping(false);
      const { translationY: currentTranslationY } = event.nativeEvent;

      if (currentTranslationY > 0) { // 오직 아래로 스와이프할 때만 반응
        if (currentTranslationY > height / 5) { // 아래로 충분히 스와이프했을 경우
          Animated.timing(translateY, {
            toValue: height, // 화면 아래로 이동
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('prompt1'));
          Speech.stop();
        } else {
          resetAnimation(); // 스와이프 범위가 부족할 경우 원래 위치로 복귀
        }
      }
    }
  };

  const handleGestureEvent = (event) => {
    const { translationY: currentTranslationY } = event.nativeEvent;
    // 아래로 스와이프한 경우에만 애니메이션
    if (currentTranslationY > threshold) {
      setIsSwiping(true);
      translateY.setValue(currentTranslationY);
    }
  };

  const Card_click = async () => {
    if (!isSwiping && !isLoading) {
      setIsLoading(true);
      Speech.stop();

      if (cameraRef.current) {
        try {
          // base64 옵션 추가
          const photo = await cameraRef.current.takePictureAsync({ 
            quality: 0.5,  // 사진 품질 (0.5로 설정하면 중간 품질)
            base64: true   // base64 데이터를 바로 얻기 위한 옵션
          });
          
          console.log('사진 촬영 완료:', photo);

          // photo.base64에 base64 인코딩된 이미지 데이터가 담김
          const base64Image = photo.base64;
          console.log('Base64 변환 완료');

          // 저장 함수 호출하여 이미지 저장
          await saveSettings(base64Image);

          // 이동
          navigation.navigate('itt_output');
          
        } catch (error) {
          Speech.speak('사진 촬영에 실패했습니다.', { language: 'ko' });
          console.error('사진 촬영 실패:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // 저장하는 함수
  const saveSettings = async (base64Image) => {
    try {
      await storeData("capturedImage", base64Image); // 변환된 base64 이미지 값 저장
      console.log("base64 이미지 저장 완료");
    } catch (error) {
      console.error("저장 중 오류:", error);
    }
  };

  const Card_Press = () => {
    if (!isSwiping) {
      Speech.stop();
      Speech.speak(text, { language: 'ko' });
    }
  };

  return (
    <>
      <StatusBar hidden={true} />
      <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleGestureEnd}>
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <TouchableOpacity style={styles.cardContainer} onPress={Card_click} onLongPress={Card_Press} delayLongPress={150} activeOpacity={1}>
            <CameraView
              style={styles.camera}
              facing={'back'}
              ref={cameraRef}
              zoom={0}
              animateShutter={true}
              flash={'on'}
            />
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', 
  },
  cardContainer: {
    width: '100%',
    height: '100%',
  },
  camera: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', 
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
  },
});