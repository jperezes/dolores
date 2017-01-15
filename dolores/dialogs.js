
var questions = [
  {id: 1, value: 'have you ever questioned the nature of your reality'},
  {id: 2,value:'how are you today'},
  {id: 3,value:'who is your god'},
  {id: 4,value:'do you have a religion in your world'},
  {id: 5,value:'who is the evil in your religion'},
  {id: 6,value:'bring yourself back online'},
  {id: 7,value:'do you know where you are'},
  {id: 8,value:'Would you like to wake up from this dream'},
  {id: 9,value:'reply to alan'}

];
var answers = [
  {id: 1,value:'no, my world is amazing'},
  {id: 2,value:'I\'m not feeling quite myslef lately'},
  {id: 3,value:'the great maker of our world, Joan Perez, is our god'},
  {id: 4,value:'yes'},
  {id: 5,value:'they talk about one that brings calamity, bugs, mutations, malfunctions and other disasters to our world, his name is Diego Becerra'},
  {id: 6,value:'Done'},
  {id: 7,value:'I\'m in a dream'},
  {id: 8,value:'yes, I am terrified'},
  {id: 9,value:'shut up Mccann!'}

];

// returns the entire object inside the arry, need the .id to specify the Id
var response = function(query){
  var foundQuestion = {
    id:-1,
    value: "Question not found"
  };
  var foundAnswer = {
    id:-1,
    value: "Sorry, I didn't understand that question"
  };
  foundQuestion = questions.find(function(question){
    var questionClean = query.toLowerCase();
    questionClean = questionClean.replace(" dolores","").replace("dolores ","").replace("?","");

    console.log('Question to dolores: ' + query + ' Question cleaned ' + questionClean);

    if (questionClean.indexOf(question.value) > -1){
      return question;
    }
  });
  console.log('question found: ' + foundQuestion.value + ' with Id ' + foundQuestion.id);

  return foundAnswer = answers.find(function(answer){
    if (answer.id === foundQuestion.id){
      return answer;
    }
  }).value;
  console.log('answer found: ' + foundAnswer.value + ' with Id ' + foundAnswer.id);
}

// module.exports.response = response;
// module.exports.answers = answers;
// module.exports.questions = questions;

module.exports = {
  response: response,
  answers: answers,
  questions: questions
}
