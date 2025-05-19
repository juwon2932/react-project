<img src="readmeimg/pull.gif" alt="영상" width="800" />
# SNS 프로젝트

## 프로젝트 소개

SNS 사이트를 만드는 개인 프로젝트를 진행했습니다.  
React를 활용해 로그인, 회원가입 기능 및 CRUD로 일상을 기록할 수 있는 웹 사이트를 만들었습니다.

## 개발 기간  
2025.05.03 ~ 2025.05.19

## 사용 기술  
### 🚀 Frontend
<p>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript (ES6%2B)-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/React Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white"/>
  <img src="https://img.shields.io/badge/MUI-007FFF?style=for-the-badge&logo=mui&logoColor=white"/>
  <img src="https://img.shields.io/badge/react--slick-000000?style=for-the-badge&logo=react&logoColor=white"/>
</p>

### 🛠 Backend
<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
</p>

### 🧰 기타
<p>
  <img src="https://img.shields.io/badge/Multer-333333?style=for-the-badge&logo=npm&logoColor=white"/>
  <img src="https://img.shields.io/badge/bcrypt-004C7F?style=for-the-badge&logo=keybase&logoColor=white"/>
</p>

## 주요 기능 및 화면 설명  

<img src="readmeimg/login.png" alt="로그인 화면" width="800" />

1. **로그인 / 로그아웃**  
- 아이디, 비밀번호 유효성 검사 및 오류 안내
- 로그인 성공 시 세션 유지(세션/로컬스토리지)
- 로그아웃 기능

<img src="readmeimg/join.png" alt="회원가입 화면" width="800" />

2. **회원가입**  
- 아이디 실시간 중복 체크 (중복 시 안내 메시지)
- 입력값 유효성 검사(빈값, 비밀번호 규칙 등)
- 모든 정보 입력 시 회원가입 완료 

<img src="readmeimg/main.png" alt="메인 화면" width="800" />

3. **메인(피드) 화면**
- 가입한 회원들의 최신 게시글 리스트 출력
- 각 게시글에 사진 첨부, 댓글 작성, 댓글 리스트 기능
- 게시글별로 좋아요, 삭제, 수정 등 기본 인터랙션 제공

<img src="readmeimg/mypage.png" alt="마이페이지" width="800" />

4. **내 프로필/프로필 수정**  
- 내 프로필 이미지 업로드/변경 기능
- 내 정보(닉네임/소개/사진) 수정
- 내가 쓴 게시글 전체 리스트 확인
- 프로필 정보 실시간 반영
 

<img src="readmeimg/Register.png" alt="글쓰기" width="800" />

6. **글 작성**  
- 텍스트, 사진, 영상 첨부 지원
- 게시글 작성/수정/삭제 CRUD 구현
- 업로드 시 실시간 피드 반영


7. **DB 연결**  
- Node.js(Express) 백엔드에서 MySQL DB 연동
- 회원/게시글/댓글 데이터 관리
- Multer를 활용한 사진 파일 업로드 구현

## 프로젝트 후기  
짧은 학습 및 개발 기간이 아쉬웠지만, 기존 경험을 바탕으로 기본 CRUD 기능을 빠르게 구현할 수 있었습니다.  
React의 빠른 렌더링 장점을 체감했고, DB 연결과 파일 업로드 같은 기능도 직접 설계하여 완성할 수 있었습니다.  
앞으로 React를 더 공부해서 추가 기능을 개발해보고 싶습니다.
