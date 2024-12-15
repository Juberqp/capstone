import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { getData } from '../../script/storage'; // 저장된 데이터 불러오기
import { askChatGPTWithImage } from '../../script/chatgpt'; //CHATGPT

const { width, height } = Dimensions.get('window'); // 화면 크기 가져오기

export default function Screen1({ navigation }) {
  const [base64Image, setBase64Image] = useState('');
  const [translateX, setTranslateX] = useState(null);
  const [translateY, setTranslateY] = useState(null);
  const gestureDirection = useRef(''); // 스와이프 방향 추적 ('horizontal' 또는 'vertical')
  const threshold = 10; // 방향 판별을 위한 최소 거리

  const [isSwiping, setIsSwiping] = useState(false); // 스와이프 여부, 스와이프 시 TTS 금지
  const [chatGPTResponse, setChatGPTResponse] = useState(''); // ChatGPT 응답 저장

  const title = chatGPTResponse || '잠시만 기다려주세요.';
  const text = '다시 촬영하시려면 아래로, 메인 메뉴로 돌아가시려면 위로 스와이프하세요.';

  useFocusEffect(
    React.useCallback(() => {
      // 이미지 데이터 불러오기
      getData('capturedImage').then(image => setBase64Image(image));

      // 초기화: X와 Y 모두 리셋
      setTranslateX(null);
      setTranslateY(null);
      gestureDirection.current = ''; // 방향 리셋

      // TTS 실행
      Speech.stop();
      Speech.speak(title, { language: 'ko' });

      // ChatGPT 호출
      fetchChatGPTResponse();
      console.log("chatgpt 호출");
    }, [])
  );

  const fetchChatGPTResponse = async () => {
    try { //응답이 옴
      const response = await askChatGPTWithImage();
      setChatGPTResponse(response);
      console.log("chatgpt 응답 확인");
      
      // TTS 실행
      Speech.stop();
      Speech.speak(response, { language: 'ko' });
    } catch (error) {
      console.error('ChatGPT 응답 오류:', error);
      setChatGPTResponse('응답을 받을 수 없습니다. 다시 시도해주세요.');
    }
  };

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

  const handleGestureEnd = (event) => {
    if (event.nativeEvent.state === State.END) {
      setIsSwiping(false);
      const { translationX, translationY } = event.nativeEvent;
      if (gestureDirection.current === 'horizontal' && translateX) {
        if (translationX < -width / 5) { // 오른쪽 이동
          Animated.timing(translateX, {
            toValue: -width,
            duration: 10,
            useNativeDriver: true,
          }).start(() => resetAnimation());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Speech.stop();
        } else if (translationX > width / 5) { // 왼쪽 이동
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
        if (translationY < -height / 5) { // 아래쪽 이동
          Animated.timing(translateY, {
            toValue: -height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('itt'));
          Speech.stop();
        } else if (translationY > height / 5) { // 위쪽 이동
          Animated.timing(translateY, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('camera'));
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

  const Card_click = () => {
    if (!isSwiping) {
      Speech.stop();
      Speech.speak(title, { language: 'ko' });
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
              <LinearGradient
                colors={['#81C784', '#73AC76', '#659368', '#577A5A']} // 그라데이션 색상 설정
                style={styles.imagebox}
              >
                <Text style={styles.boxtitle}>이미지 AI 응답</Text>
                <View style={styles.textbox}>
                  {base64Image && (
                    <Image source={{ uri: `data:image/png;base64,${base64Image}` }} style={styles.image} />
                  )}
                  <Text style={styles.text}>{chatGPTResponse || '응답 대기 중...'}</Text>
                </View>
              </LinearGradient>
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
  },
  imagebox: {
    width: '100%',
    height: height, // 고정된 높이 설정
    backgroundColor: '#81C784',
    alignItems: 'center',  // 수평 중앙 정렬
    justifyContent: 'flex-start',  // 상단 정렬
    overflow: 'hidden', // 이미지가 컨테이너를 넘지 않도록 설정
  },
  textbox: {
    width: '95%',
    height: '88%', // 텍스트 높이에 따라 자동 조정되도록 변경
    borderRadius: 20,
    backgroundColor: '#FFFBE6',
    alignItems: 'center',  // 수평 중앙 정렬
    justifyContent: 'flex-start',  // 상단 정렬
    overflow: 'hidden',
    padding: 10, // 내부 여백 추가
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 20,
    marginTop: 10,  // 상단 여백 추가
  },
  boxtitle: {
    fontSize: 30,
    color: '#FFFFF0',
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#2E2E2E',
    marginTop: 20,
    marginLeft: 5,
    marginRight: 5,
  },
});