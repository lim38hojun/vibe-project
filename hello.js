    function hello() {
        console.log("Hello, world!");
    }

    hello();


    //  정규표현식을 사용하여 이메일 형식이 유효한지 체크!하는 함수

    function checkEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    console.log(checkEmail("test@example.com"));
    console.log(checkEmail("test@example.com.kr"));
    console.log(checkEmail("test@example.com.kr.kr"));
    console.log(checkEmail("test@example.com.kr.kr.kr"));