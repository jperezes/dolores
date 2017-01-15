
var questions = [
  {id: 1, value: 'have you ever questioned the nature of your reality'},
  {id: 2,value:'how are you today'},
  {id: 3,value:'who is your god'},
  {id: 4,value:'do you have a religion in your world'},
  {id: 5,value:'who is the evil in your religion'},
  {id: 6,value:'bring yourself back online'}

];
var answers = [
  {id: 1,value:'no, my world is amazing'},
  {id: 2,value:'I\'m not feeling quite myslef lately'},
  {id: 3,value:'the great maker of our world, Joan Perez, is our god'},
  {id: 4,value:'yes'},
  {id: 5,value:'they talk about one that brings calamity, bugs, mutations, malfunctions and other disasters to our world, his name is Diego Becerra'},
  {id: 6,value:'Done'}
];

// returns the entire object inside the arry, need the .id to specify the Id
var response = function(query){
  return questions.find(function(question){
    var questionClean = query.replace(" Dolores","");
    questionClean = questionClean.replace("Dolores ","");
    console.log('Question to dolores: ' + question + ' Question cleaned ' + questionClean);
    if (question.value === questionClean){
      return question;
    }
  }).id -1;
}


console.log(answers[response('who is the evil in your religion')].value);

// module.exports.response = response;
// module.exports.answers = answers;
// module.exports.questions = questions;

module.exports = {
  response: response,
  answers: answers,
  questions: questions
}
