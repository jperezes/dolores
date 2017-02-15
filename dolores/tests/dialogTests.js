
var expect = require('expect.js');
var Dialog = require('../routes/dialogs');
var dialogModule = new Dialog();


var dialogs = [
  {
    id: "1",
    question: "have you ever questioned the nature of your reality",
    response: "no, my world is amazing"
  },
  {
    id: "2",
    question:"how are you today",
    response:"I\'m not feeling quite myslef lately"
  },
  {
    id: "3",
    question:"who is your god",
    response:"the great maker of our world, Joan Perez, is our god"
  },
  {
    id: "4",
    question:"do you have a religion in your world",
    response:"yes"
  },
  {
    id: "5",
    question:"who is the evil in your religion",
    response:"they talk about one that brings calamity, bugs, mutations, malfunctions and other disasters to our world, his name is Alan Maccann"
  },
  {
    id: "6",
    question:"bring yourself back online",
    response: "Done"
  },
  {
    id: "7",
    question:"do you know where you are",
    response:"I\'m in a dream"
  },
  {
    id: "8",
    question:"would you like to wake up from this dream",
    response:"yes, I am terrified"
  },
  {
   id: "9",
   question:"reply to alan",
   response: "shut up Mccann!"
 },
  {
    id: "10",
    question:"is that right",
    response: "yes my maker!"
  }
];
var space = {
	roomId: "test",
	roomType: "test",
	personName: "Joan Perez",
	personEmail: "joan@fake.com",
	nickName: "Joan",
	macReports: {
		receive: "yes" ,
		tags: ["whiteboard", "auxiliarydeviceservice", "wirelessshare"]
	},
	splunkReports: {
		receive: "yes"
	},
	windowsReports: {
		receive: "no",
		tags: []
	}
};


var question = {

  id:"fake_id",
  roomId:"fake_romId",
  roomType:"direct",
  personId:"fake_personId",
  personEmail:"joan@fake.com",
  created:"2017-02-02T00:55:50.555Z",
  message:"1",
  person:{
  id:"fake_id",
  emails:["fake@fake.com"],
  displayName:"Joan Perez",
  nickName:"Joan",
  firstName:"Joan",
  lastName:"Perez",
  avatar:"https://fakeavatar.com",
  orgId:"fake_orgId",
  created:"2012-06-15T20:51:08.969Z",
  lastActivity:"2017-02-02T00:55:20.737Z",
  status:"active",
  type:"person"
  }
};

var showCurrentOptions = function(space) {
  reply = "** ·Name:** " + space.personName +
                          "\n** ·Email:** " + space.personEmail +
                          "\n** ·Receive Spark Mac Reports?** " + space.macReports.receive +
                          "\n** ·Mac Reports filter tags:** " + space.macReports.tags +
                          "\n** ·Receive Spark Windows Reports?** " + space.windowsReports.receive +
                          "\n** ·Windows Reports filter tags:** " + space.windowsReports.tags +
                          "\n** ·Receive Splunk Alerts? **" + space.splunkReports.receive;

  return {
      reply: function() {
            return reply;
      }
  }
};


describe('server', function() {

	beforeEach(function() {
	});

	after(function() {
		var endSpace = dialogModule.showSchema();
		expect(endSpace.personEmail).to.equal("");
		expect(endSpace.macReports.receive).to.equal("");
	});

	describe('register user to the Database through questionary', function() {
		it('Test1: dialog invalid question', function(done){
			dialogModule.parseQuestion(question,function(err, res) {
        expect(err).to.equal(null);
        expect(res).to.exist;
        expect(res).to.equal("sorry, I didn't understand that");
        done();
      });
		});

			it('Test2: bringing dolores online', function(done){
				question.message = "bring yourself back online";
				dialogModule.parseQuestion(question,function(err, res) {
	        expect(err).to.equal(null);
	        expect(res).to.exist;
	        expect(res).to.equal("Done, what can I do for you " + question.person.nickName + "?"+ dialogModule.showMenu());
	        done();
	      });
			});
			it('Test3: answering 1 to register', function(done){
				question.message = "1";
				var expectedReply = "** ·Name:** " + question.person.displayName +
			                          "\n** ·Email:** " + question.personEmail +
			                          "\n** ·Is this data correct? answer <yes/no>";
				dialogModule.parseQuestion(question,function(err, res) {
					expect(err).to.equal(null);
					expect(res).to.exist;
					expect(res).to.equal(expectedReply);
					done();
				});
			});
			it('Test4: answering yes to validate data', function(done){
				question.message = "yes";
				var expectedReply = "Do you want me to send you Mac reports as they happen? <yes/no>";
				dialogModule.parseQuestion(question,function(err, res) {
					expect(err).to.equal(null);
					expect(res).to.exist;
					expect(res).to.equal(expectedReply);
					done();
				});
			});
			it('Test5: answering for mac options', function(done){
				question.message = "yes";
				var expectedReply = "Please write the tags you want to filter the mac reports " +
								"to receive separated by comma. (i.e: whiteboard, auxiliaryDeviceService.cpp,whiteboardView.swift):";
				dialogModule.parseQuestion(question,function(err, res) {
					expect(err).to.equal(null);
					expect(res).to.exist;
					expect(res).to.equal(expectedReply);
					done();
				});
			});

			it('Test6: populating mac options', function(done){
				question.message = "whiteboard,auxiliaryDeviceService,wirelessShare";
				var expectedReply = "Do you want me to send you Spark for Windows crash reports? <yes/no>";
				dialogModule.parseQuestion(question,function(err, res) {
					expect(err).to.equal(null);
					expect(res).to.exist;
					expect(res).to.equal(expectedReply);
					done();
				});
			});

			it('Test7: Saying no to windows reports', function(done){
				question.message = "no";
				var expectedReply = "No Spark for Windows crash reports will be sent to you " + question.person.nickName +
				"\nDo you want me to send you Splunk reports? <yes/no>";
				dialogModule.parseQuestion(question,function(err, res) {
					expect(err).to.equal(null);
					expect(res).to.exist;
					expect(res).to.equal(expectedReply);
					done();
				});
			});

			it('Test8: Saying yes to Splunk Reports', function(done){
				question.message = "yes";
				var expectedReply = "Is the following data correct?\n" + showCurrentOptions(space).reply() +
                            "\n** Is this data correct? answer <yes/no>**";
				dialogModule.parseQuestion(question,function(err, res) {
					expect(err).to.equal(null);
					expect(res).to.exist;
					expect(res).to.equal(expectedReply);
					done();
				});
			});
			it('Test9: Validating final data, proceed to save to database', function(done){
				question.message = "yes";
				var expectedReply = "Welcome to Westworld " + space.nickName + "!";
				dialogModule.parseQuestion(question,function(err, res) {
					expect(err).to.equal(null);
					expect(res).to.exist;
					expect(res).to.equal(expectedReply);
					done();
				});
			});
		});

		describe('Delete previous user from the database', function() {

        //From here we start again and then show the user options saved on the database
        it('Test1: bringing dolores online again', function(done){
          question.message = "bring yourself back online";
          dialogModule.parseQuestion(question,function(err, res) {
            expect(err).to.equal(null);
            expect(res).to.exist;
            expect(res).to.equal("Done, what can I do for you " + question.person.nickName + "?"+ dialogModule.showMenu());
            done();
          });
        });
        it('Test2: answering 3 to show the options', function(done){
          question.message = "3";
          var expectedReply = "These are currently your registration options: " + question.person.nickName + "\n" + showCurrentOptions(space).reply();
          dialogModule.parseQuestion(question,function(err, res) {
            expect(err).to.equal(null);
            expect(res).to.exist;
            expect(res).to.equal(expectedReply);
            done();
          });
        });

        //Finally proceed to delete the user from the database
				it('Test3: bringing dolores online', function(done){
					question.message = "bring yourself back online";
					dialogModule.parseQuestion(question,function(err, res) {
						expect(err).to.equal(null);
						expect(res).to.exist;
						expect(res).to.equal("Done, what can I do for you " + question.person.nickName + "?"+ dialogModule.showMenu());
						done();
					});
				});
				it('Test4: answering 2 check the user is deleted', function(done){
					question.message = "2";
					var expectedReply = "User deleted from the database";
					dialogModule.parseQuestion(question,function(err, res) {
						expect(err).to.equal(null);
						expect(res).to.exist;
						expect(res).to.equal(expectedReply);
						done();
					});
				});
				it('Test5a: bringing dolores online', function(done){
					question.message = "bring yourself back online";
					dialogModule.parseQuestion(question,function(err, res) {
						expect(err).to.equal(null);
						expect(res).to.exist;
						expect(res).to.equal("Done, what can I do for you " + question.person.nickName + "?"+ dialogModule.showMenu());
						done();
					});
				});

				it('Test5: answering 2 check the user i not even registered', function(done){
					question.message = "2";
					var expectedReply = "User not present in the database";
					dialogModule.parseQuestion(question,function(err, res) {
						expect(err).to.equal(null);
						expect(res).to.exist;
						expect(res).to.equal(expectedReply);
						done();
					});
				});
			});
});
