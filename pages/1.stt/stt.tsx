//stt
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { storeData, getData } from '../../script/storage'; //저장 불러오기

const { width, height } = Dimensions.get('window'); // 화면 크기 가져오기

export default function Screen1({ navigation }) {
  const [translateX, setTranslateX] = useState(null);
  const [translateY, setTranslateY] = useState(null);
  const imageboxScale = useRef(new Animated.Value(0)).current; // 스프링 애니메이션 값
  const gestureDirection = useRef(''); // 스와이프 방향 추적 ('horizontal' 또는 'vertical')
  const threshold = 10; // 방향 판별을 위한 최소 거리

  const [isSwiping, setIsSwiping] = useState(false); //스와이프 여부, 스와이프 시 TTS 금지
  
  const title = '음성 질문';
  const text = '음성으로 질문하시면 알맞은 응답을 해드립니다.';

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
      setTranslateX(null);
      setTranslateY(null);
      gestureDirection.current = ''; // 방향 리셋

      // TTS 실행
      Speech.stop();
      Speech.speak(title, { language: 'ko' });
  
      // 스프링 애니메이션 실행
      Animated.spring(imageboxScale, {
        toValue: 1, // 최종 크기
        friction: 5, // 스프링 마찰력
        useNativeDriver: false, // 크기 조정을 위해 false
      }).start();
  
      return () => {
        // 화면을 벗어나면 애니메이션 초기화
        imageboxScale.setValue(0); // 올바르게 imageboxScale 사용
      };
    }, [imageboxScale])
  );
  

  const handleGestureEnd = async (event) => {
    if (event.nativeEvent.state === State.END) {
      setIsSwiping(false);
      const { translationX, translationY } = event.nativeEvent;
      if (gestureDirection.current === 'horizontal' && translateX) {
        if (translationX < -width / 5) { //오른쪽 이동
          Animated.timing(translateX, {
            toValue: -width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('itt'));
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
          //api 확인, 없다면 안넘어 감
          const api = await getData('api');
          console.log('api:', api);

          if (!api) {
            Animated.timing(translateY, {
              toValue: -height,
              duration: 10,
              useNativeDriver: true,
            }).start(() => resetAnimation());
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Speech.stop();
            Speech.speak("API 키가 입력되지 않았습니다.", { language: 'ko' });
          } else if (!api.startsWith("sk-")) {
            Animated.timing(translateY, {
              toValue: -height,
              duration: 10,
              useNativeDriver: true,
            }).start(() => resetAnimation());
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Speech.stop();
            Speech.speak("올바른 API 키를 입력해주세요.", { language: 'ko' });
          } else {
            Animated.timing(translateY, {
              toValue: -height,
              duration: 200,
              useNativeDriver: true,
            }).start(() => navigation.navigate('stt_record'));
            Speech.stop();
          }
        } else if (translationY > height / 5) { //위쪽 이동
          Animated.timing(translateY, {
            toValue: height,
            duration: 10,
            useNativeDriver: true,
          }).start(() => resetAnimation());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      imageboxScale.setValue(0.5); // 강제로 초기화
      Animated.spring(imageboxScale, {
        toValue: 1, // 최종 크기
        friction: 5,
        useNativeDriver: false,
      }).start();

      Speech.stop();
      Speech.speak(title, { language: 'ko' });
    }
  };

  const Card_Press = () => {
    if (!isSwiping) {
      imageboxScale.setValue(0.5); // 강제로 초기화
      Animated.spring(imageboxScale, {
        toValue: 1, // 최종 크기
        friction: 5,
        useNativeDriver: false,
      }).start();

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
              <Animated.View style={[styles.imagebox,{
                transform: [{ scale: imageboxScale }], // 스프링 효과로 크기 변화
              },]}>
                <Image source={require('../../data/icon/stt.png')} style={styles.image} />
              </Animated.View>
              <Text style={styles.title}>음성 질문</Text>
              <Text style={styles.text}>음성으로 질문하시면</Text>
              <Text style={styles.text}>알맞은 응답을 해드립니다.</Text>
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
  content: {
    flex: 1,
    justifyContent: 'flex-start', // 상단 정렬
    alignItems: 'center', // 가로 중앙 정렬
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center', // 수평 중앙 정렬
    width: '100%',
    height: '100%',
  },
  imagebox: {
    width: 280, // 원형의 너비 (직경)
    height: 280, // 원형의 높이 (직경)
    borderRadius: 100, // 원형: 직경의 절반
    justifyContent: 'center', // 수직 중앙 정렬
    alignItems: 'center', // 수평 중앙 정렬
    backgroundColor: '#FF7F7F',
    marginTop: 0, // imagebox과 title 간 간격
    marginBottom: 120, // imagebox과 title 간 간격
    overflow: 'hidden', // 이미지가 원 밖으로 넘지 않도록 설정
    
    // 그림자 스타일 추가
    shadowColor: '#000', // 그림자 색상
    shadowOffset: { width: 10, height: 10 }, // 그림자 위치 (오른쪽 아래)
    shadowOpacity: 0.3, // 그림자 투명도
    shadowRadius: 15, // 그림자 퍼짐 정도
    elevation: 10, // Android용 그림자
  },
  image: {
      width: '80%', // 원형 박스의 너비에 맞춤
      height: '80%', // 원형 박스의 높이에 맞춤
      resizeMode: 'cover', // 비율 유지하며 원형 박스를 채움
  },
  title: {
    fontSize: 30,
    color: '#2E2E2E',
    fontWeight: 'bold',
    alignSelf: 'flex-start', // 개별 요소를 왼쪽 정렬
    marginLeft: 30, // 왼쪽 기준에서 20px 떨어짐
    marginBottom: 20, // Title과 text 간 간격
  },
  text: {
    fontSize: 22,
    color: '#2E2E2E',
    alignSelf: 'flex-start', // 개별 요소를 왼쪽 정렬
    marginLeft: 30, // 왼쪽 기준에서 20px 떨어짐
    textAlign: 'left',
  },
});