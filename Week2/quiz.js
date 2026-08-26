const quiz = [  { 
    question: "Which language is used for webpage interactivity?", 
    options: ["HTML","CSS","JS","Python"],  answer: "JS" 
}, 
{ 
    question: "Which tag creates a heading?", 
    options: ["p","h1","img","a"],  answer: "h1" 
}, 
{ 
    question: "CSS is used for?", 
    options: ["Styling","Programming","Database","Networking"], answer: "Styling" 
}, 
{ 
    question: "Which symbol is used for comments in JavaScript?", 
    options: ["//","#","<!-- -->","**"],    answer: "//" 
}, 
{ 
    question: "Which function displays a popup message?", 
    options: ["alert()","print()","scanf()","cout"],    answer: "alert()" 
}]; 
quiz.sort(() => Math.random() - 0.5); 
let index = 0; 
let score = 0; 
let time = 30; 
let timer; 
const question = document.getElementById("question"); 
const options = document.getElementById("options"); 
const result = document.getElementById("result"); 
const timerBox = document.getElementById("timer"); 
function loadQuestion(){ 
    clearInterval(timer); 
    time = 30; 
    question.innerHTML = quiz[index].question; 
    options.innerHTML = ""; 
    quiz[index].options.sort(() => Math.random() - 0.5); 
    quiz[index].options.forEach(option => { 
        options.innerHTML +=`<input type="radio" name="ans" value="${option}">${option}<br>`; }); 
    timerBox.innerHTML = "Time : " + time; 
    timer = setInterval(function(){ 
        time--; 
        timerBox.innerHTML = "Time : " + time; 
        if(time == 0){ 
            clearInterval(timer); 
            nextQuestion(); 
        }   },1000);    } 
function nextQuestion(){ 
    clearInterval(timer); 
    const selected = document.querySelector('input[name="ans"]:checked'); 
    if(selected && selected.value == quiz[index].answer){ 
        score++; 
    } 
    index++; 
    if(index < quiz.length){ 
        loadQuestion(); 
    } 
    else{ 
        question.innerHTML = ""; 
        options.innerHTML = ""; 
        timerBox.innerHTML = ""; 
        result.innerHTML = "Your Score : " + score + " / " + quiz.length; 
}   } 
loadQuestion(); 