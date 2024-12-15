import { Audio } from "expo-av";
import { getData } from './storage'; // 저장된 데이터 불러오기

const audioRecordingRef = {
  current: null as Audio.Recording | null, // 녹음 객체 참조
};

const uploadAudioToOpenAI = async (audioUri: string) => {
  try {
    //api 확인
    const OPENAI_API_KEY = await getData('api');
    if (!OPENAI_API_KEY) {
      console.error('저장된 api를 찾을 수 없습니다.');
      throw new Error('전송할 api가 없습니다.');
    } else {
      console.log('전송할 api 준비 확인');
    }

    const formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      name: "audio.mp4",
      type: "audio/mp4",
    });
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API 요청 실패: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    throw new Error(`API 전송 중 오류 발생: ${error.message}`);
  }
};

export const startRecording = async (): Promise<string> => {
  try {
    // 오디오 권한 요청
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("오디오 녹음 권한이 필요합니다.");
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    audioRecordingRef.current = new Audio.Recording();

    const recordingOptions = {
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      android: {
        extension: ".mp4",
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: ".wav",
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };

    await audioRecordingRef.current.prepareToRecordAsync(recordingOptions);
    await audioRecordingRef.current.startAsync();
    
    console.log('✅ 녹음이 시작되었습니다.');
    return "✅ 녹음이 시작되었습니다.";
  } catch (error) {
    throw new Error(`녹음 시작 실패: ${error.message}`);
  }
};

export const stopRecording = async (): Promise<string> => {
  try {
    if (!audioRecordingRef.current) {
      throw new Error("녹음이 시작되지 않았습니다.");
    }

    await audioRecordingRef.current.stopAndUnloadAsync();
    const uri = audioRecordingRef.current.getURI();

    if (!uri) {
      throw new Error("녹음 파일이 생성되지 않았습니다.");
    }

    const transcription = await uploadAudioToOpenAI(uri);
    console.log('✅ 녹음 종료');
    return `${transcription}`;
  } catch (error) {
    throw new Error(`녹음 종료 실패: ${error.message}`);
  } finally {
    audioRecordingRef.current = null;
  }
};

//즉시 중단
export const pauseRecording = async (): Promise<void> => {
  if (audioRecordingRef.current) {
    try {
      // 녹음 중지
      await audioRecordingRef.current.stopAndUnloadAsync();
      console.log("✅ 녹음이 즉시 중단되었습니다.");
    } catch (error) {
      console.log("❌ 녹음 중단 중 문제가 발생했지만 무시합니다.");
    } finally {
      audioRecordingRef.current = null; // 녹음 객체 초기화
    }
  } else {
    console.log("ℹ️ 녹음이 진행 중이 아닙니다.");
  }
};