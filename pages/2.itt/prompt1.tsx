//prompt1
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window'); // 화면 크기 가져오기

export default function Screen1({ navigation }) {
  const [translateX, setTranslateX] = useState(null);
  const [translateY, setTranslateY] = useState(null);
  const gestureDirection = useRef(''); // 스와이프 방향 추적 ('horizontal' 또는 'vertical')
  const threshold = 10; // 방향 판별을 위한 최소 거리

  const [isSwiping, setIsSwiping] = useState(false); //스와이프 여부, 스와이프 시 TTS 금지
  
  const title = '음성 프롬프트';
  const text = '원하시는 질문을 음성으로 질문하여 AI에게 전달합니다.';

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
      Speech.speak(title, { language: 'ko' });
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
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('prompt2'));
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
          Animated.timing(translateY, {
            toValue: -height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('itt_record'));
          Speech.stop();
        } else if (translationY > height / 5) { //위쪽 이동
          Animated.timing(translateY, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => navigation.navigate('itt'));
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
                <Text style={styles.boxtitle} >1번</Text>
                <Text style={styles.boxtitle}>음성 프롬프트</Text>
              </LinearGradient>
              <Text style={styles.title}>음성으로 질문합니다.</Text>
              <Text style={styles.text}>원하시는 질문을 음성으로</Text>
              <Text style={styles.text}>질문하여 AI에게 전달합니다.</Text>
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
    flex: 0.6, // 화면의 세로 절반을 채웁니다.
    backgroundColor: '#81C784',
    alignItems: 'center', // 수평 중앙 정렬
    borderBottomLeftRadius: 20, // 아래 왼쪽 모서리를 둥글게 설정합니다.
    borderBottomRightRadius: 20, // 아래 오른쪽 모서리를 둥글게 설정합니다.
    overflow: 'hidden', // 이미지가 원 밖으로 넘지 않도록 설정
  },
  image: {
      width: '40%', // 원형 박스의 너비에 맞춤
      height: '40%', // 원형 박스의 높이에 맞춤
      resizeMode: 'cover', // 비율 유지하며 원형 박스를 채움
  },
  boxtitle: {
    fontSize: 30,
    color: '#FFFFF0',
    fontWeight: 'bold',
    alignSelf: 'flex-start', // 개별 요소를 왼쪽 정렬
    marginLeft: 30,
    marginTop: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    color: '#2E2E2E',
    fontWeight: 'bold',
    alignItems: 'center', // 수평 중앙 정렬
    marginLeft: 30, // 왼쪽 기준에서 20px 떨어짐
    marginTop: 150,
    marginBottom: 20, // Title과 text 간 간격
  },
  text: {
    fontSize: 22,
    color: '#2E2E2E',
    alignItems: 'center', // 수평 중앙 정렬
    marginLeft: 30, // 왼쪽 기준에서 20px 떨어짐
    textAlign: 'left',
  },
});