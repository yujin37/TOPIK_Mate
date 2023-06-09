import React, { useState, useEffect,useRef } from 'react';
import { View, Text, Button, StyleSheet,TouchableOpacity, Image, Modal,ScrollView } from 'react-native';
import AppNameHeader from './component/AppNameHeader';
import firestore from '@react-native-firebase/firestore';
import {subscribeAuth } from "../lib/auth";
import firebase from '@react-native-firebase/app';
import storage from '@react-native-firebase/storage'
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

//Listening
const TypeQuestScreenLc = ({navigation, route}) =>{
  const { source, paddedIndex, prbSection,userEmail } = route.params;//이전 페이지에서 정보 받아오기
  const [problems, setProblems] = useState([]); //문제 구성
  const [currentIndex, setCurrentIndex] = useState(0); // 현재 인덱스이고
  const [choice1ImageUrl, setChoice1ImageUrl] = useState(null) //선택지1 이미지
  const [choice2ImageUrl, setChoice2ImageUrl] = useState(null) // 선택지2 이미지
  const [choice3ImageUrl, setChoice3ImageUrl] = useState(null) // 선택지3 이미지
  const [choice4ImageUrl, setChoice4ImageUrl] = useState(null) // 선택지4 이미지
  const [submitted, setSubmitted]=useState(false); //제출여부 확인
  const [selectedChoice, setSelectedChoice] = useState(null); //선택한 선택지 기록
  const [Last,setLast] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalProblem, setTotalProblem] = useState(0);
  const [CorrectProb, setCorrectProb] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);//재생관련
  const [prbchoice, setPrbChoice] = useState([]); //문제 풀 때 선택한 정보 저장
  const [prbstatus, setprbstatus]=useState(true); // 문제끝
  const audioRef = useRef(null); 

  // 콜렉션 불러오기
  const loadProblems = async () => {
    //console.log('진입')
    
    try {
      const prblist = [];
      const problemCollection = firestore()
        .collection('problems')
        .doc(prbSection)
        .collection(source)
        .doc(paddedIndex)
        .collection('PRB_LIST');
      //const temp = await problemCollection.where("PRB_ID", ">=", "").orderBy('PRB_ID').get();
      let query = problemCollection.orderBy('__name__').limit(5);
      if(Last){
        query = query.startAfter(Last);
      }
      const temp_snapshot = await query.get();
    
      temp_snapshot.forEach((doc) => {
        const data = doc.data();
        prblist.push(data);
      });
      if(temp_snapshot.empty){
        setprbstatus(false);
      }
      //console.log(`데이터 불러오기 완료. temp:`, prblist);
      if(prblist.length > 0  &&prbstatus == true ){
        const lastDoc = temp_snapshot.docs[temp_snapshot.docs.length - 1];
        if (lastDoc) {
          const lastDocId = lastDoc.id; 
          setLast(lastDocId);
        }else {
          setLast(null);
        }
        setProblems((prevProblems) => {
          const newProblems = [...prevProblems, ...prblist];
          console.log('problems in loadProblems:', newProblems);
          if (newProblems.length === prblist.length) {
            // 첫 데이터 로딩 후 이미지 로딩 처리
            console.log('데이터 적립완료');
            //console.log(newProblems)
            ImageLoading(newProblems);
          }
          return newProblems;
        });
        
        
      } else {
        console.log('No more problems to load.');
        setLast(null);
      }
    } catch (error) {
      console.log(error);
    }
    
  };

  useEffect(() => {//새로 진입시 기존 문제 세팅 초기화
    if (problems.length !== 0) {
      setProblems([]);
      //loadProblems();
    }

    //
  }, [paddedIndex]);
  useEffect(() => {//길이가 0일 경우에 처리
    if (problems.length === 0) {
      setCurrentIndex(0);
      loadProblems();
      //ImageLoading();
    }
  }, [problems]);

  useEffect(() => { //제출상태 확인해서 이미지 로딩도 하고 이것저것

    console.log('problems.length:', problems.length, currentIndex);
    if (problems.length !== 0 && problems.length - 1 === currentIndex) {
      loadProblems();
      ImageLoading(problems);
      stopPlaying();
    } else if (problems.length !== 0) {
      //setSelectedChoice(null);
      //setSubmitted(false);
      console.log(currentIndex);
      ImageLoading(problems);
      stopPlaying();
    }
    setIsLoading(false);
  }, [currentIndex]);
  


  // 불러온 문제 확인
  useEffect(()=>{
    
    if (problems.length !== 0) {
      console.log(`problems[0].PRB_ID: ${problems[0].PRB_ID}`);
    }
  }, [problems])
  useEffect(() => {
    // 상태 변경 시 필요한 업데이트 로직 작성
  }, [isPlaying]);
  //선택지
  const handleChoice = (choice) => {
    setSelectedChoice(choice.toString());  
  };
  //이미지 로드
  const ImageLoading = async (problems_new)=>{
    console.log('이미지 로드 시작');
    //console.log('문제 아이디', problems_new);
    const nextProblem = problems_new[currentIndex].PRB_ID;
    const nextProbslice = nextProblem.slice(0,9)
    if ((paddedIndex === '001'&& prbSection === 'LV2') || paddedIndex==='003' && prbSection ==='LV1') {
      try { 
        const choice1ImageRef = storage()
          .ref()
          //.child(`images/${prbSection}/LS_TAG/${paddedIndex}/${problems[currentIndex+1].PRB_ID}_1.png`);
          .child(`images/${nextProbslice}/${problems_new.find(problem_new => problem_new.PRB_ID === nextProblem).PRB_CHOICE1}`)
        const choice2ImageRef = storage()
          .ref()
          //.child(`images/${prbSection}/LS_TAG/${paddedIndex}/${problems[currentIndex+1].PRB_ID}_2.png`);
          .child(`images/${nextProbslice}/${problems_new.find(problem_new => problem_new.PRB_ID === nextProblem).PRB_CHOICE2}`)
        const choice3ImageRef = storage()
          .ref()
          //.child(`images/${prbSection}/LS_TAG/${paddedIndex}/${problems[currentIndex+1].PRB_ID}_3.png`);
          .child(`images/${nextProbslice}/${problems_new.find(problem_new => problem_new.PRB_ID === nextProblem).PRB_CHOICE3}`)
        const choice4ImageRef = storage()
          .ref()
          //.child(`images/${prbSection}/LS_TAG/${paddedIndex}/${problems[currentIndex+1].PRB_ID}_4.png`);
          .child(`images/${nextProbslice}/${problems_new.find(problem => problem.PRB_ID === nextProblem).PRB_CHOICE4}`)
          
        const [choice1ImageUrl, choice2ImageUrl, choice3ImageUrl, choice4ImageUrl] =
          await Promise.all([
            choice1ImageRef.getDownloadURL(),
            choice2ImageRef.getDownloadURL(),
            choice3ImageRef.getDownloadURL(),
            choice4ImageRef.getDownloadURL(),
          ]);

        setChoice1ImageUrl(choice1ImageUrl);
        setChoice2ImageUrl(choice2ImageUrl);
        setChoice3ImageUrl(choice3ImageUrl);
        setChoice4ImageUrl(choice4ImageUrl);
        //console.log(choice4ImageUrl);
      } catch (error) {
        console.log('Error occurred while downloading image', error);
      }
    }
  }
  //다음버튼
  const handleNextProblem = async () => {
    if (currentIndex < problems.length - 1) {
      console.log('앞으로가기 진입');
      setSelectedChoice(null);
      setSubmitted(false);
      setCurrentIndex((prevIndex) => prevIndex + 1);
      const check =  prbchoice.find(item => item.Prb_num === problems[currentIndex+1].PRB_ID);
      if ( check && problems[currentIndex+1].PRB_ID === check.Prb_num) {
        console.log('같습니다.', currentIndex+1)
        setSubmitted(true); 
        setSelectedChoice(prbchoice.find(item => item.Prb_num === problems[currentIndex+1].PRB_ID).User_answer);
      }
    } 
  };
  
  //이전 문제
  const handlePreviousProblem = async () => {
    if (currentIndex > 0) {
      setSelectedChoice(null);
      setSubmitted(false);
      setCurrentIndex((prevIndex) => prevIndex - 1);
      const check =  prbchoice.find(item => item.Prb_num === problems[currentIndex-1].PRB_ID)?.Prb_num
      console.log('뒤로 가기 확인',  problems[currentIndex-1].PRB_ID, check);
      if ( problems[currentIndex-1].PRB_ID === check) {
        console.log('뒤로 같습니다.')
        setSubmitted(true); 
        setSelectedChoice(prbchoice.find(item => item.Prb_num === problems[currentIndex-1].PRB_ID)?.User_answer);
        console.log('상태확인2',submitted, selectedChoice)
      }
    }
  };

  const handleSubmitProblem = async () => {
    console.log('제출 버튼 클릭');
    console.log('선택한 보기:', selectedChoice, '실제 정답:', problems[currentIndex].PRB_CORRT_ANSW);
    const isCorrect = selectedChoice === problems[currentIndex].PRB_CORRT_ANSW;
    const nowProb = {
      Prb_num: problems[currentIndex].PRB_ID, //제출 버튼 누르면 번호와
      User_answer: selectedChoice.toString() //사용자가 선택한 답을 넣어서
    };
    prbchoice.push(nowProb);   //딕셔너리로 넣어주자
    console.log('선택지 상태: ', prbchoice);
    if (isCorrect) { //맞춘 갯수 저장
      setCorrectProb(prevCorrectProb => prevCorrectProb + 1);
    } else if (!isCorrect) { //틀린 경우에 오답노트로 전달, 여기 만들어야 함.
      console.log('틀렸음', problems[0]);
      try {
        const querySnapshot = await firestore()
          .collection('users')
          .where('email', '==', userEmail)
          .get();
  
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const userId = userData.u_uid;
          console.log(userId);
          let collectionPath = '';
  
          if (prbSection == 'LV1') {
            collectionPath = `wrong_lv1/${source}/PRB_TAG/${paddedIndex}`;
          } else {
            collectionPath = `wrong_lv2/${source}/PRB_TAG/${paddedIndex}`;
          }
  
          console.log('경로확인', collectionPath);
          //const collectionPath = `${source}/PRB_TAG/${paddedIndex}/PRB_LIST`;
          const problemId = problems[currentIndex].PRB_ID;
  
          const querySnapshot2 = await firestore()
            .collection(collectionPath)
            .where('PRB_ID', '==', problemId)
            .get();
  
          if (querySnapshot2.empty) {
            const docId = problems[currentIndex].PRB_ID;
            console.log(problems[currentIndex]);
            const docData = {
              AUD_REF: problems[currentIndex].AUD_REF,
              IMG_REF: problems[currentIndex].IMG_REF,
              PRB_CHOICE1: problems[currentIndex].PRB_CHOICE1,
              PRB_CHOICE2: problems[currentIndex].PRB_CHOICE2,
              PRB_CHOICE3: problems[currentIndex].PRB_CHOICE3,
              PRB_CHOICE4: problems[currentIndex].PRB_CHOICE4,
              PRB_CORRT_ANSW: problems[currentIndex].PRB_CORRT_ANSW,
              PRB_ID: problems[currentIndex].PRB_ID,
              PRB_MAIN_CONT: problems[currentIndex].PRB_MAIN_CONT,
              PRB_NUM: problems[currentIndex].PRB_NUM,
              PRB_POINT: problems[currentIndex].PRB_POINT,
              PRB_RSC: problems[currentIndex].PRB_RSC,
              PRB_SCRPT: problems[currentIndex].PRB_SCRPT,
              PRB_SECT: problems[currentIndex].PRB_SECT,
              PRB_SUB_CONT: problems[currentIndex].PRB_SUB_CONT,
              PRB_TXT: problems[currentIndex].PRB_TXT,
              TAG: problems[currentIndex].TAG,
              USER_CHOICE: prbchoice.find(item => item.Prb_num === problems[currentIndex].PRB_ID)?.User_answer,
              듣기대본: problems[currentIndex].듣기대본,
              연속문제: problems[currentIndex].연속문제,
            };
            console.log(`최종 확인 users/${userId}/${collectionPath}/PRB_LIST/${docId}`)
            await firestore().doc(`users/${userId}/${collectionPath}/PRB_LIST/${docId}`).set(docData); //기존 문제추가
            await firestore().doc(`users/${userId}/${collectionPath}`).set({ PRB_LIST_COUNT: 1 }); //문제 수 카운트
            console.log('새로운 문서 생성 완료');
          } else {
            console.log('이미 같은 PRB_ID를 가진 문서가 존재합니다.');
          }
        } else {
          console.log('일치하는 이메일을 가진 사용자가 존재하지 않습니다.');
        }
      } catch (error) {
        console.error('문서 생성 에러:', error);
      }
    }
    setTotalProblem(prevTotalProblem => prevTotalProblem + 1); // 전체 문제 갯수 저장
    console.log(isCorrect, '전체 문제: ', totalProblem, '맞은 문제: ', CorrectProb);
    setSubmitted(true);
  };
  const handlePress = () => {//모달창 처리
    stopPlaying();
    setModalVisible(true);
  };
  const handleConfirm = () => { //모달 확인버튼
    setModalVisible(false);
    navigation.navigate('Home');
  };
  const getAudioDownloadURL = async (audioRef) => { //오디오 다운로드
    try {
      const reference = storage().ref(audioRef); 
      const downloadURL = await reference.getDownloadURL(); 
      return downloadURL;
    } catch (error) {
      console.log('Failed to get audio download URL', error);
      return null;
    }
  };
  const handlePlayButtonPress = async () => {//재생버튼
    console.log(`${problems[currentIndex].AUD_REF}`);
    if (isPlaying) {
      stopPlaying();
    }
    else{
      startPlaying()
    }
  }
  const stopPlaying = () => { //재생중지
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current.release();
      setIsPlaying(false);
    }
  };
  const startPlaying = async () => { //재생시작
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current.release();
    }
    const Problem = problems[currentIndex].PRB_ID;
    const Probslice = Problem.slice(0,9)

    const audiopath = `audios/${Probslice}/${problems[currentIndex].AUD_REF}`; //경로 얻고
    const downloadUrl = await getAudioDownloadURL(audiopath); // 다운로드 받아서
    if (downloadUrl){ 
      audioRef.current = new Sound(downloadUrl, '', (error) => { //세팅하고

      if(error){
        console.log('Fail to load sound', error); // 실패하면 알려주고
        return;
      }
      console.log('success to load sound');//성공하면 로드되었다고 알려주고
    
      audioRef.current.play(() => {
        setIsPlaying(false);
        audioRef.current.release();
      });
    });
    setIsPlaying(true);
    }else{
      console.log('fail to download url');
    };
      
  };
  
  
  return (
    <View style={[styles.container, styles.containerPos]}>
      <ScrollView>
        <View style={[styles.container, styles.containerPos]}>
          <Text> {source} , {paddedIndex} {currentIndex} </Text>
          <View style={{flexDirection:'row'}}>
              <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={handlePress}> 
              <View>
                <Image
                  source={require('../assets/out-icon.png')}
                  style={styles.outButton}
                />
              </View>
              </TouchableOpacity>
              <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View>
                  <Text style={styles.typeend}> 유형별 문제 풀이 종료 </Text>
                  <View style={styles.circle}>
                    <Text style={styles.score}>{CorrectProb}/{totalProblem}</Text>
                    
                  </View>
                  <Text style={{fontSize:25,textAlign:'center'}}>{totalProblem}문제 중 {CorrectProb}문제 맞췄습니다.</Text>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={[styles.buttonTextpass]}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
          {isLoading ? (
            <Text>Loading...</Text>
          ) : (
            <View>
              {problems.length > 0 && (
                <>
                  <Text>{currentIndex + 1}.{problems[currentIndex].PRB_MAIN_CONT}</Text>
                  <View style={styles.container}>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: isPlaying ? '#FFACAC' : '#BBD6B8' }]}
                      onPress={handlePlayButtonPress}
                    >
                      <Text style={styles.buttonText}>{isPlaying ? 'Stop' : 'Start'}</Text>
                    </TouchableOpacity>
                  </View>
                  {((paddedIndex === '001' && prbSection==='LV2')|| (paddedIndex ==='003' && prbSection ==='LV1'))&& (
                    <>
                      <TouchableOpacity style={[styles.button, choice1ImageUrl ? { height: 103, width: 153, resizeMode: 'contain' } : null, { backgroundColor: submitted ? (selectedChoice === '1' ? (selectedChoice === problems[currentIndex].PRB_CORRT_ANSW ? '#BAD7E9' : '#FFACAC') : (problems[currentIndex].PRB_CORRT_ANSW === '1' ? '#BAD7E9' : '#D9D9D9')) : (selectedChoice === '1' ? '#BBD6B8' : '#D9D9D9') }]} onPress={() => handleChoice(1)}>
                        {choice1ImageUrl && <Image source={{ uri: choice1ImageUrl }} style={styles.choiceImage} />}
                        {!choice1ImageUrl && <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE1}</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, choice2ImageUrl ? { height: 103, width: 153, resizeMode: 'contain' } : null, { backgroundColor: submitted ? (selectedChoice === '2' ? (selectedChoice === problems[currentIndex].PRB_CORRT_ANSW ? '#BAD7E9' : '#FFACAC') : (problems[currentIndex].PRB_CORRT_ANSW === '2' ? '#BAD7E9' : '#D9D9D9')) : (selectedChoice === '2' ? '#BBD6B8' : '#D9D9D9') }]} onPress={() => handleChoice(2)}>
                        {choice2ImageUrl && <Image source={{ uri: choice2ImageUrl }} style={styles.choiceImage} />}
                        {!choice2ImageUrl && <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE2}</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, choice3ImageUrl ? { height: 103, width: 153, resizeMode: 'contain' } : null, { backgroundColor: submitted ? (selectedChoice === '3' ? (selectedChoice === problems[currentIndex].PRB_CORRT_ANSW ? '#BAD7E9' : '#FFACAC') : (problems[currentIndex].PRB_CORRT_ANSW === '3' ? '#BAD7E9' : '#D9D9D9')) : (selectedChoice === '3' ? '#BBD6B8' : '#D9D9D9') }]} onPress={() => handleChoice(3)}>
                        {choice3ImageUrl && <Image source={{ uri: choice3ImageUrl }} style={styles.choiceImage} />}
                        {!choice3ImageUrl && <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE3}</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, choice3ImageUrl ? { height: 103, width: 153, resizeMode: 'contain' } : null, { backgroundColor: submitted ? (selectedChoice === '4' ? (selectedChoice === problems[currentIndex].PRB_CORRT_ANSW ? '#BAD7E9' : '#FFACAC') : (problems[currentIndex].PRB_CORRT_ANSW === '4' ? '#BAD7E9' : '#D9D9D9')) : (selectedChoice === '4' ? '#BBD6B8' : '#D9D9D9') }]} onPress={() => handleChoice(4)}>
                        {choice4ImageUrl && <Image source={{ uri: choice4ImageUrl }} style={styles.choiceImage} />}
                        {!choice4ImageUrl && <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE4}</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                  {((paddedIndex !== '001' && prbSection==='LV2')|| (paddedIndex !=='003' && prbSection ==='LV1'))&&(
                    <>
                      <TouchableOpacity style={[styles.button,styles.buttonContainer,{backgroundColor: submitted? selectedChoice ==='1'? selectedChoice=== problems[currentIndex].PRB_CORRT_ANSW? '#BAD7E9':'#FFACAC': problems[currentIndex].PRB_CORRT_ANSW === '1'? '#BAD7E9': '#D9D9D9' : selectedChoice === '1'? '#BBD6B8': '#D9D9D9'}, { marginTop: 10 } ]} onPress={() => handleChoice(1)} disabled={submitted}>
                        <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE1}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button,styles.buttonContainer,{backgroundColor: submitted? selectedChoice ==='2'? selectedChoice=== problems[currentIndex].PRB_CORRT_ANSW? '#BAD7E9':'#FFACAC': problems[currentIndex].PRB_CORRT_ANSW === '2'? '#BAD7E9': '#D9D9D9' : selectedChoice === '2'? '#BBD6B8': '#D9D9D9'}, { marginTop: 10 }]} onPress={() => handleChoice(2)} disabled={submitted}>
                        <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE2}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button,styles.buttonContainer,{backgroundColor: submitted? selectedChoice ==='3'? selectedChoice=== problems[currentIndex].PRB_CORRT_ANSW? '#BAD7E9':'#FFACAC': problems[currentIndex].PRB_CORRT_ANSW === '3'? '#BAD7E9': '#D9D9D9' : selectedChoice === '3'? '#BBD6B8': '#D9D9D9'}, { marginTop: 10 }]} onPress={() => handleChoice(3)} disabled={submitted}>
                        <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE3}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button,styles.buttonContainer,{backgroundColor: submitted? selectedChoice ==='4'? selectedChoice=== problems[currentIndex].PRB_CORRT_ANSW? '#BAD7E9':'#FFACAC': problems[currentIndex].PRB_CORRT_ANSW === '4'? '#BAD7E9': '#D9D9D9' : selectedChoice === '4'? '#BBD6B8': '#D9D9D9'}, { marginTop: 10 }]} onPress={() => handleChoice(4)} disabled={submitted}>
                        <Text style={styles.buttonText}>{problems[currentIndex].PRB_CHOICE4}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <View style={styles.buttonSumitContainer}>
                    <TouchableOpacity style={[styles.buttonsubmit, { opacity: (selectedChoice !== null && !submitted) ? 1 : 0.5 }]} onPress={handleSubmitProblem} disabled={selectedChoice === null || submitted === true}>
                      <Text style={styles.buttonTextpass}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
    
          <View style={styles.fixToText}>
            {currentIndex >= 0 && (
              <TouchableOpacity style={[styles.buttonprevious, currentIndex === 0 && { opacity: 0.5 }]} onPress={handlePreviousProblem} disabled={currentIndex === 0}>
                <Text style={styles.buttonTextprevious}>Previous</Text>
              </TouchableOpacity>
            )}
            {currentIndex < problems.length-1 ? (
              <TouchableOpacity style={[styles.buttonpass, { opacity: submitted !== false ? 1 : 0.5 }]} onPress={handleNextProblem} disabled={submitted === false}>
                <Text style={styles.buttonTextpass}>Next</Text>
              </TouchableOpacity>
            ) : (
              <View style={{flexDirection:'row'}}> 

                <TouchableOpacity style={[styles.buttonpass,{ opacity: submitted !== false ? 1 : 0.5 }]} onPress={handlePress} disabled={submitted === false}>
                  <Text style={styles.buttonTextpass}>End</Text>
                </TouchableOpacity>
                <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.typeend}> 유형별 문제 풀이 종료 </Text>
                      <View style={styles.circle}>
                        <Text style={styles.score}>{CorrectProb}/{totalProblem}</Text>
                        
                      </View>
                      <Text style={{fontSize:25,textAlign:'center'}}>{totalProblem}문제 중 {CorrectProb}문제 맞췄습니다.</Text>
                      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Text style={[styles.buttonTextpass]}>확인</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
  
};

const styles = StyleSheet.create({
  container:{
    padding: 10,
  },
  containerPos: {
    flex:20
  },
  choiceImage: {
    width: 150,
    height: 100,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10, 
    justifyContent: 'center',
    alignItems: 'center',
    //flex: 1,
  },
  button: {
    backgroundColor: '#D9D9D9',
    marginBottom: 10,
    borderRadius: 5,
    //height: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  buttonText:{
    marginLeft: 10,
    fontSize: 15,
  },
  buttonpass: {
    marginTop: 100,
    alignSelf: 'flex-end',
    backgroundColor: '#A4BAA1',
    padding: 10,
    borderRadius: 5,
  },
  buttonprevious: {
    marginTop: 100,
    alignSelf: 'flex-start',
    backgroundColor: '#A4BAA1',
    padding: 10,
    borderRadius: 5,
  },
  buttonTextpass: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical:'center',
  },
  buttonTextprevious: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },  
  buttonContainer:{
    flexDirection: 'row',
  },
  fixToText:{
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonsubmit:{
    backgroundColor: '#AFB9AE',
    height: 30,
    width: 80,
    borderRadius: 5,
  },
  buttonSumitContainer:{
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixToText:{
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  outButton:{
    width: 20,
    height: 20,
    right: 10,
  },
  confirmButton:{
    backgroundColor: '#BBD6B8',
    borderRadius: 5,
    top: 50,
    height: 35,
    width: 100,
    alignSelf: 'center',
  },
  circle: {
    width: 300,
    height: 300,
    borderRadius: 200,
    backgroundColor: '#BBD6B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeend:{
    fontSize: 30,
    textAlign:'center',
    fontWeight:'bold',
    marginTop: 5,
  },
  score:{
    fontSize: 80,
    color: 'white',
    textAlign:'center',
    fontWeight:'bold',
  }
  
});

export default TypeQuestScreenLc;