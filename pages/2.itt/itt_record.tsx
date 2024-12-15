//itt_record
import React, { useRef, useState } from 'react';
import { View, Text, Image, Linking, Animated, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar'; 
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import { storeData, getData } from '../../script/storage'; //저장 불러오기
import { startRecording, stopRecording, pauseRecording } from '../../script/record_api'; //녹음

const { width, height } = Dimensions.get('window');

export default function Screen1({ navigation }) {
  const [translateX, setTranslateX] = useState(null);
  const [translateY, setTranslateY] = useState(null);
  const gestureDirection = useRef(''); // 스와이프 방향 추적 ('horizontal' 또는 'vertical')
  const threshold = 10; // 방향 판별을 위한 최소 거리

  // 녹음 상태 관리하는 상태 변수
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [output, setoutput] = useState<string>("");

  const [isSwiping, setIsSwiping] = useState(false); //스와이프 여부, 스와이프 시 TTS 금지
  
  const [text, settext] = useState<string>("질문을 하시려면 화면을 클릭하시고 원하시는 질문을 하신 다음 다시 화면을 클릭하세요.");

  const resetAnimation = () => {
    if (translateX) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    if (translateY) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // 초기화: X와 Y 모두 리셋
      setTranslateX(null);
      setTranslateY(null);
      gestureDirection.current = ''; // 방향 리셋
      
      // TTS 실행
      Speech.stop();
      Speech.speak(text, { language: 'ko' });
    }, [])
  );

  const handleGestureEnd = (event) => {
    if (event.nativeEvent.state === State.END) {
      setIsSwiping(false);
      const { translationX, translationY } = event.nativeEvent;
      if (gestureDirection.current === 'horizontal' && translateX) {
        if (translationX < -width / 5) { //오른쪽 이동
          Animated.timing(translateX, {
            toValue: -width,
            duration: 10,
            useNativeDriver: true,
          }).start(() => resetAnimation());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Speech.stop();
        } else if (translationX > width / 5) { //왼쪽 이동
          Animated.timing(translateX, {
            toValue: width,
            duration: 10,
            useNativeDriver: true,
          }).start(() => resetAnimation());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Speech.stop();
        } else {
          resetAnimation();
        }
      } else if (gestureDirection.current === 'vertical' && translateY) {
        if (translationY < -height / 5) { //아래쪽 이동
          if(!output){
            Animated.timing(translateY, {
              toValue: -height,
              duration: 10,
              useNativeDriver: true,
            }).start(() => resetAnimation());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Speech.stop();
            Speech.speak("먼저 질문을 해주세요.", { language: 'ko' });
          } else {
            Animated.timing(translateY, {
              toValue: -height,
              duration: 200,
              useNativeDriver: true,
            }).start(() => navigation.navigate('camera'));
            Speech.stop();
          }
        } else if (translationY > height / 5) { //위쪽 이동
          pauseRecording() //녹음 중 뒤로 돌아가면 종료
          Animated.timing(translateY, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('prompt1'));
          Speech.stop();
        } else {
          resetAnimation();
        }
      }
      gestureDirection.current = '';
    }
  };

  const handleGestureEvent = (event) => {
    const { translationX, translationY } = event.nativeEvent;

    if (!gestureDirection.current) {
      if (Math.abs(translationX) > threshold || Math.abs(translationY) > threshold) {
        setIsSwiping(false);
        if (Math.abs(translationX) > Math.abs(translationY)) {
          gestureDirection.current = 'horizontal';
          setTranslateX(new Animated.Value(0));
        } else {
          gestureDirection.current = 'vertical';
          setTranslateY(new Animated.Value(0));
        }
      }
    }

    if (gestureDirection.current === 'horizontal' && translateX) {
      translateX.setValue(translationX);
    } else if (gestureDirection.current === 'vertical' && translateY) {
      translateY.setValue(translationY);
    }
  };

  // 저장하는 함수
  const saveSettings = async (stopMessage) => {
    try {
      await storeData("prompt", stopMessage); // 변환된 base64 이미지 값 저장
      console.log("1번 음성 분석 프롬프트 설정");
    } catch (error) {
      console.log("저장 중 오류:", error);
    }
  };

  const Card_click = async () => {
    if (!isSwiping) {
      if (isRecording) {
        // 녹음 중인 경우 -> 녹음 종료
        try {
          stopRecording()
            .then((stopMessage) => {
              setoutput(stopMessage); //응답 검사, 녹음하지 않으면 넘어가지 못함

              setMessage(stopMessage);
              Speech.stop();
              Speech.speak(`${stopMessage}..........다시 녹음 하시려면 화면을 클릭하시고 만족하신다면 위로 스와이프하세요.`, { language: 'ko' });
              settext(`${stopMessage}..........다시 녹음 하시려면 화면을 클릭하시고 만족하신다면 위로 스와이프하세요.`);
              
              // 저장 함수 호출하여 출력 저장
              saveSettings(stopMessage);
            })
            .catch((error) => {
              console.log(`오류: ${error.message}`);
              Speech.stop();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Speech.speak("오류가 발생하였습니다. API를 확인해주세요.", { language: 'ko' });
            });
          Speech.stop();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Speech.speak("잠시만 기다려주세요.", { language: 'ko' });
          setIsRecording(false); // 녹음 상태를 종료로 변경

        } catch (error) {
          console.log(`오류: ${error.message}`);
          Speech.stop();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Speech.speak("오류가 발생하였습니다. API를 확인해주세요.", { language: 'ko' });
        }        
      } else {
        // 녹음 중이 아닌 경우 -> 녹음 시작
        try {
          Speech.stop();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          const startMessage = await startRecording();
          setIsRecording(true); // 녹음 상태를 시작으로 변경

        } catch (error) {
          console.log(`오류: ${error.message}`);
          Speech.stop();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Speech.speak("오류가 발생하였습니다. API를 확인해주세요.", { language: 'ko' });
        }
      }
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
        <Animated.View style={[styles.container, { transform: [{ translateX: translateX || 0 }, { translateY: translateY || 0 }] }]}>
          <View style={styles.content}>
            <TouchableOpacity
                style={[styles.button]} // 별도의 스타일 정의
                onPress={Card_click}
                onLongPress={Card_Press}
                delayLongPress={150}
                activeOpacity={1}
            > 
              <View style={[styles.buttonui, {backgroundColor: isRecording ? "#FF6347" : "#808080"},]}>
                <Text style={styles.buttontext}> {isRecording ? "녹음 중지하기" : "녹음 시작하기"}</Text>
              </View>
              <Text style={styles.message}>{message}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBE6',
  },
  button: {
    width: '100%',
    height: '100%',

    justifyContent: 'center', // 수직 중앙 정렬
    alignItems: 'center', // 수평 중앙 정렬
  },
  buttonui: {
    width: 300, // 원형의 너비 (직경)
    height: 300, // 원형의 높이 (직경)
    borderRadius: 150, // 원형: 직경의 절반
    justifyContent: 'center', // 수직 중앙 정렬
    alignItems: 'center', // 수평 중앙 정렬
    overflow: 'hidden', // 이미지가 원 밖으로 넘지 않도록 설정

    // 그림자 스타일 추가
    shadowColor: '#000', // 그림자 색상
    shadowOffset: { width: 10, height: 10 }, // 그림자 위치 (오른쪽 아래)
    shadowOpacity: 0.3, // 그림자 투명도
    shadowRadius: 15, // 그림자 퍼짐 정도
    elevation: 10, // Android용 그림자
  },
  buttontext: {
    fontSize: 30,
    color: '#FFFBE6',
  },
  message: {
    fontSize: 16,
    marginTop: 10,
  },
});