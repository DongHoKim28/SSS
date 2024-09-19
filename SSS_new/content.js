// 자막창 생성 및 설정
const subtitleDiv = document.createElement('div');
subtitleDiv.style.position = 'fixed';
subtitleDiv.style.top = '10px';
subtitleDiv.style.right = '10px';
subtitleDiv.style.width = '300px';
subtitleDiv.style.height = 'auto';
subtitleDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
subtitleDiv.style.border = '1px solid black';
subtitleDiv.style.zIndex = '10000';
subtitleDiv.style.padding = '10px';
subtitleDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
subtitleDiv.style.color = 'white';
subtitleDiv.style.display = 'block';
subtitleDiv.style.borderRadius = '10px';

// 자막 헤더와 다운로드 버튼을 포함하는 컨테이너 생성
const headerContainer = document.createElement('div');
headerContainer.style.display = 'flex';
headerContainer.style.justifyContent = 'space-between';
headerContainer.style.alignItems = 'center';

// 자막 헤더 추가
const subtitleHeader = document.createElement('div');
subtitleHeader.textContent = 'SSS (Smart Subtitle System)';
subtitleHeader.style.margin = '0';
subtitleHeader.style.fontSize = '16px';
subtitleHeader.style.fontWeight = 'bold';
subtitleHeader.style.marginBottom = '10px';
headerContainer.appendChild(subtitleHeader);

// Download 버튼 생성
const downloadButton = document.createElement('button');
downloadButton.textContent = 'Download';
downloadButton.style.marginLeft = 'auto';
downloadButton.style.border = '1px solid black';
downloadButton.style.backgroundColor = 'gray';
downloadButton.style.color = 'white';
downloadButton.style.fontSize = '12px';

// Download 버튼 클릭 이벤트
downloadButton.addEventListener('click', () => {
  const subtitleText = document.querySelector('#subtitleText').textContent;
  const blob = new Blob([subtitleText], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `subtitle_${currentLanguage}.txt`;
  link.click();
});

headerContainer.appendChild(downloadButton); // 헤더 옆에 Download 버튼 추가

// 헤더 컨테이너를 자막창에 추가
subtitleDiv.appendChild(headerContainer);

// 자막 표시 영역 생성
const subtitleBox = document.createElement('div');
subtitleBox.style.width = '300px';
subtitleBox.style.height = '150px';
subtitleBox.style.backgroundColor = 'white';
subtitleBox.style.border = '1px solid black';
subtitleBox.style.marginBottom = '10px';
subtitleBox.style.overflowY = 'auto';
subtitleBox.style.overflowX = 'hidden';
subtitleDiv.appendChild(subtitleBox);

// 자막 텍스트 표시
const subtitleText = document.createElement('p');
subtitleText.id = 'subtitleText';
subtitleText.style.margin = '0';
subtitleText.style.padding = '10px';
subtitleText.style.color = 'black';
subtitleText.style.fontSize = '16px';
subtitleBox.appendChild(subtitleText);

// 언어 선택 레이블 추가
const languageLabel = document.createElement('span');
languageLabel.textContent = 'Language: ';
languageLabel.style.marginRight = '5px';
languageLabel.style.fontSize = '20px';
subtitleDiv.appendChild(languageLabel);

// 언어 선택 드롭다운 메뉴 생성
const languageSelect = document.createElement('select');
languageSelect.style.marginTop = '10px';
languageSelect.style.marginRight = '5px';
languageSelect.style.border = '1px solid black';
languageSelect.style.backgroundColor = 'white';
languageSelect.style.color = 'black';

// 지원되는 언어 목록 업데이트
const languages = [
  { value: 'ko', text: '한국어' },
  { value: 'en', text: 'English' },
  { value: 'zh', text: '中文 (중국어)' },
  { value: 'ja', text: '日本語 (일본어)' },
  { value: 'th', text: 'ไทย (태국어)' },
  { value: 'vi', text: 'Tiếng Việt (베트남어)' },
  { value: 'de', text: 'Deutsch (독일어)' },
  { value: 'fr', text: 'Français (프랑스어)' },
  { value: 'ru', text: 'Русский (러시아어)' },
  { value: 'el', text: 'Ελληνικά (그리스어)' }
];

languages.forEach(lang => {
  const option = document.createElement('option');
  option.value = lang.value;
  option.textContent = lang.text;
  languageSelect.appendChild(option);
});

let currentLanguage = 'ko';
let fetchIntervalId = null; // 주기적으로 데이터를 가져오는 setInterval ID
let currentUrl = window.location.href; // 현재 URL을 추적하는 변수

languageSelect.addEventListener('change', (event) => {
  currentLanguage = event.target.value;
  fetchPythonSubtitles(currentLanguage);
  console.log(`Selected language: ${currentLanguage}`);
});

const closeButton = document.createElement('button');
closeButton.textContent = '종료';
closeButton.style.marginTop = '10px';
closeButton.style.border = '1px solid black';
closeButton.style.backgroundColor = 'gray';
closeButton.style.color = 'white';

closeButton.addEventListener('click', () => {
  subtitleDiv.style.display = 'none';
});

subtitleDiv.appendChild(languageSelect);
subtitleDiv.appendChild(closeButton);

document.body.appendChild(subtitleDiv);

function displaySubtitles(text) {
  const subtitleText = document.querySelector('#subtitleText');
  if (subtitleText) {
    subtitleText.innerHTML = text;  // 기존 텍스트 대체
  }
}

function sendUrlToServer(url) {
  displaySubtitles('서버에 요청을 보냈습니다.<br>요청 결과를 기다리는 중...');
  console.log(123);
  fetch('https://www.smartsubtitlesystem.com/process_url', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `url=${encodeURIComponent(url)}`,
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.statusText}`);
    }
    return response.text();
  })
  .then(data => {
    console.log("Server response:", data);
    if (fetchIntervalId) {
      clearInterval(fetchIntervalId); // 성공적으로 서버가 응답하면 주기적 요청을 중지합니다.
      fetchIntervalId = null;
    }
    fetchPythonSubtitles(currentLanguage); // 자막을 한 번 가져옵니다.
  })
  .catch(error => {
    console.error('Error sending URL to server:', error);
    displaySubtitles(`서버와의 연결에 실패했습니다.<br>오류: ${error.message}`);
  });
}

function fetchPythonSubtitles(language = 'ko') {
  displaySubtitles('서버와 연결을 시도 중입니다...');
  console.log(222);
  fetch(`https://www.smartsubtitlesystem.com/get_subtitle?lang=${language}`)
      .then(response => {
          if (!response.ok) {
              throw new Error(`서버 응답 오류: ${response.statusText}`);
          }
          return response.text();
      })
      .then(text => {
          console.log("Fetched subtitle text:", text); 
          if (text) {
              displaySubtitles(text);
              if (fetchIntervalId) {
                  clearInterval(fetchIntervalId); // 자막을 성공적으로 가져오면 주기적 요청을 중지합니다.
                  fetchIntervalId = null;
              }
          } else {
              displaySubtitles('서버에 연결되었습니다. 그러나 자막이 없습니다.');
          }
      })
      .catch(error => {
          console.error('Error fetching subtitles:', error);
          displaySubtitles(`서버와의 연결에 실패했습니다.<br>오류: ${error.message}`);
      });
}

// 현재 URL이 변경되었는지 감지하고, 변경 시 새로고침
function checkUrlChange() {
  if (currentUrl !== window.location.href) {
    console.log("URL changed, reloading extension...");
    currentUrl = window.location.href;
    displaySubtitles('서버에 요청을 보냈습니다.<br>요청 결과를 기다리는 중...'); // URL이 변경되면 즉시 메시지 표시
    sendUrlToServer(currentUrl); // 새로운 URL로 서버에 요청
  }
}

// 현재 페이지의 URL을 가져와 서버에 전송
sendUrlToServer(currentUrl);

// URL 변경 감지 시작
window.addEventListener('load', () => {
  fetchIntervalId = setInterval(() => fetchPythonSubtitles(currentLanguage), 5000);  // 5초마다 자막 가져오기
  setInterval(checkUrlChange, 1000); // 1초마다 URL 변경 감지
});
