import { SBPLUS } from './sbplus-dev';

let quizTracker = [];

/**
 * Resolves a usable Element from mixed XML/DOM collection inputs.
 * @param {Array|NodeList|HTMLCollection|Node|Object|null} data Source context value.
 * @returns {Element|null}
 */
function getContextElement(data) {
    if (!data) {
        return null;
    }

    if (data.nodeType === Node.ELEMENT_NODE) {
        return data;
    }

    if (Array.isArray(data) || data instanceof NodeList || data instanceof HTMLCollection) {
        return data[0] || null;
    }

    if (typeof data === 'object' && data[0] && data[0].nodeType === Node.ELEMENT_NODE) {
        return data[0];
    }

    return null;
}

/**
 * Reads XML node content and strips CDATA/script content for safe rendering.
 * @param {Element|null} node XML node to read.
 * @returns {string}
 */
function getXmlTextContent(node) {
    if (!node) {
        return '';
    }

    const html = node.innerHTML || node.textContent || '';
    return SBPLUS.noScript(SBPLUS.noCDATA(html));
}

/**
 * Gets an attribute value from an XML node, returning an empty string when missing.
 * @param {Element|null} node XML element.
 * @param {string} name Attribute name.
 * @returns {string}
 */
function getNodeAttr(node, name) {
    if (!node) {
        return '';
    }

    const value = node.getAttribute(name);
    return value == null ? '' : value;
}

/**
 * Builds quiz state from XML and tracks learner responses for the current question.
 * @param {Object} obj Quiz metadata created by page parsing.
 * @param {Array|NodeList|HTMLCollection|Element|null} data XML node context for the quiz.
 */
let Quiz = function (obj, data) {
    const self = this;
    const cntx = getContextElement(data);
    const qId = Number(obj.id.join().replace(',', ''));

    if (!cntx) {
        self.quiz = {
            id: qId,
            type: 'shortanswer',
            question: '',
            questionImg: '',
            questionAudio: '',
            stuAnswer: '',
            correct: false,
        };
        self.quizContainer = SBPLUS.layout.quizContainer;
        return;
    }

    const qType = cntx.firstElementChild ? cntx.firstElementChild.nodeName.toLowerCase() : 'shortanswer';
    const question = cntx.querySelector('question');
    const qTitle = getXmlTextContent(question);
    let qImg = '';
    let qAudio = '';

    const questionImgAttr = getNodeAttr(question, 'image').trim();
    if (!SBPLUS.isEmpty(questionImgAttr)) {
        qImg = SBPLUS.noScript(questionImgAttr);
    }

    const questionAudioAttr = getNodeAttr(question, 'audio').trim();
    if (!SBPLUS.isEmpty(questionAudioAttr)) {
        qAudio = SBPLUS.noScript(questionAudioAttr);
    }

    self.quiz = {
        id: qId,
        type: qType,
        question: qTitle,
        questionImg: qImg,
        questionAudio: qAudio,
        stuAnswer: '',
        correct: false,
    };

    self.quizContainer = SBPLUS.layout.quizContainer;

    switch (qType) {
        case 'multiplechoicesingle': {
            const mcs = cntx.querySelector('multipleChoiceSingle');
            const retryAttr = getNodeAttr(mcs, 'retry').trim().toLowerCase();
            self.quiz.retry = retryAttr === 'yes' || retryAttr === 'true';

            const choicesNode = cntx.querySelector('choices');
            const randomAttr = getNodeAttr(choicesNode, 'random').trim().toLowerCase();
            self.quiz.random = randomAttr === 'yes' || randomAttr === 'true';

            self.quiz.answers = [];

            const msChoices = choicesNode ? choicesNode.querySelectorAll('answer') : [];
            for (const choice of msChoices) {
                const answer = {};

                const valueNode = choice.querySelector('value');
                answer.value = SBPLUS.noScript((valueNode ? valueNode.textContent : '').trim());

                const imgAttr = getNodeAttr(choice, 'image').trim();
                if (!SBPLUS.isEmpty(imgAttr)) {
                    answer.img = SBPLUS.noScript(imgAttr);
                }

                const audioAttr = getNodeAttr(choice, 'audio').trim();
                if (!SBPLUS.isEmpty(audioAttr)) {
                    answer.audio = SBPLUS.noScript(audioAttr);
                    answer.value = answer.audio;
                }

                const correctAttr = getNodeAttr(choice, 'correct').trim().toLowerCase();
                if (!SBPLUS.isEmpty(correctAttr) && (correctAttr === 'yes' || correctAttr === 'true')) {
                    answer.correct = SBPLUS.noScript(correctAttr);
                }

                const feedbackNode = choice.querySelector('feedback');
                if (feedbackNode) {
                    answer.feedback = getXmlTextContent(feedbackNode);
                }

                self.quiz.answers.push(answer);
            }
            break;
        }

        case 'multiplechoicemultiple': {
            const mcm = cntx.querySelector('multipleChoiceMultiple');
            const retryAttr = getNodeAttr(mcm, 'retry').trim().toLowerCase();
            self.quiz.retry = retryAttr === 'yes' || retryAttr === 'true';

            const choicesNode = cntx.querySelector('choices');
            const randomAttr = getNodeAttr(choicesNode, 'random').trim().toLowerCase();
            self.quiz.random = randomAttr === 'yes' || randomAttr === 'true';

            self.quiz.answers = [];

            const mmChoices = choicesNode ? choicesNode.querySelectorAll('answer') : [];
            for (const choice of mmChoices) {
                const answer = {};

                const valueNode = choice.querySelector('value');
                answer.value = SBPLUS.noScript((valueNode ? valueNode.textContent : '').trim());

                const imgAttr = getNodeAttr(choice, 'image').trim();
                if (!SBPLUS.isEmpty(imgAttr)) {
                    answer.img = SBPLUS.noScript(imgAttr);
                }

                const audioAttr = getNodeAttr(choice, 'audio').trim();
                if (!SBPLUS.isEmpty(audioAttr)) {
                    answer.audio = SBPLUS.noScript(audioAttr);
                    answer.value = answer.audio;
                }

                const correctAttr = getNodeAttr(choice, 'correct').trim().toLowerCase();
                if (!SBPLUS.isEmpty(correctAttr) && (correctAttr === 'yes' || correctAttr === 'true')) {
                    answer.correct = SBPLUS.noScript(correctAttr);
                }

                self.quiz.answers.push(answer);
            }

            const cFB = cntx.querySelector('correctFeedback');
            const iFB = cntx.querySelector('incorrectFeedback');

            if (cFB) {
                self.quiz.correctFeedback = getXmlTextContent(cFB);
            }

            if (iFB) {
                self.quiz.incorrectFeedback = getXmlTextContent(iFB);
            }
            break;
        }

        case 'shortanswer': {
            const fb = cntx.querySelector('feedback');
            if (fb) {
                self.quiz.feedback = getXmlTextContent(fb);
            }
            break;
        }

        case 'fillintheblank': {
            const fitbCFB = cntx.querySelector('correctFeedback');
            const fitbIFB = cntx.querySelector('incorrectFeedback');

            if (fitbCFB) {
                self.quiz.correctFeedback = getXmlTextContent(fitbCFB);
            }

            if (fitbIFB) {
                self.quiz.incorrectFeedback = getXmlTextContent(fitbIFB);
            }

            const answerNode = cntx.querySelector('answer');
            self.quiz.answer = SBPLUS.noScript((answerNode ? answerNode.textContent : '').trim());
            break;
        }
    }

    if (!questionExists(self.quiz.id)) {
        quizTracker.push(this.quiz);
    }
};

/**
 * Renders either the quiz prompt or prior feedback based on saved response state.
 * @returns {void}
 */
Quiz.prototype.getQuiz = function () {
    const self = this;
    let answered = false;

    self.qIndex = getCurrentQuizItem(quizTracker, self.quiz.id);

    if (Array.isArray(quizTracker[self.qIndex].stuAnswer)) {
        if (quizTracker[self.qIndex].stuAnswer.length >= 1) {
            answered = true;
        }
    } else if (!SBPLUS.isEmpty(quizTracker[self.qIndex].stuAnswer)) {
        answered = true;
    }

    if (answered) {
        self.renderFeedback();
    } else {
        self.renderQuiz();
    }

    if (SBPLUS.xml.settings.mathjax === 'on' || SBPLUS.xml.settings.mathjax === 'true') {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
    }
};

/**
 * Renders the question UI and answer inputs for the current quiz type.
 * @returns {void}
 */
Quiz.prototype.renderQuiz = function () {
    const self = this;
    const container = document.querySelector(self.quizContainer);

    if (!container) {
        return;
    }

    let questionImg = '';
    let questionAudio = '';
    let html = '<h2 class="sbplus_quiz_header"><span class="icon-assessment" aria-hidden="true"></span>';
    html += ' Self Assessment</h2>';

    if (!SBPLUS.isEmpty(self.quiz.questionImg)) {
        questionImg = '<p><img src="' + SBPLUS.assetsPath + 'images/' + self.quiz.questionImg + '" /></p>';
    }

    if (!SBPLUS.isEmpty(self.quiz.questionAudio)) {
        questionAudio = '<p><audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + self.quiz.questionAudio + '" type="audio/mpeg" /></audio></p>';
    }

    html += '<div id="quiz-question" class="sbplus_quiz_question">' + questionImg + questionAudio + self.quiz.question + '</div>';
    html += '<div class="sbplus_quiz_input" role="group" aria-labelledby="quiz-question"></div>';
    html += '<button class="sbplus_quiz_submit_btn">Submit</button>';

    container.innerHTML = html;

    const inputContainer = container.querySelector('.sbplus_quiz_input');

    switch (self.quiz.type) {
        case 'multiplechoicesingle': {
            let msInput = '<fieldset><legend>Choose your answer:</legend>';

            if (self.quiz.random) {
                shuffle(self.quiz.answers);
            }

            self.quiz.answers.forEach((answer, i) => {
                let cleanMSValue = SBPLUS.sanitize(answer.value);

                if (!SBPLUS.isEmpty(answer.img)) {
                    cleanMSValue = SBPLUS.sanitize(answer.img);
                    msInput += '<label class="img_val" for="' + cleanMSValue + '"><input type="radio" id="' + cleanMSValue + '" name="ms" value="' + i + '" /><img src="' + SBPLUS.assetsPath + 'images/' + answer.img + '" alt="' + answer.value + '"/ ></label>';
                    return;
                }

                if (!SBPLUS.isEmpty(answer.audio)) {
                    cleanMSValue = SBPLUS.sanitize(answer.audio);
                    msInput += '<label class="au_val" for="' + cleanMSValue + '"><input type="radio" id="' + cleanMSValue + '" name="ms" value="' + i + '" /> <audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + answer.audio + '" type="audio/mpeg"/></audio></label>';
                    return;
                }

                msInput += '<label for="' + cleanMSValue + '"><input type="radio" id="' + cleanMSValue + '" name="ms" value="' + i + '" /> ' + answer.value + '</label>';
            });

            msInput += '</fieldset>';
            if (inputContainer) {
                inputContainer.innerHTML = msInput;
            }
            break;
        }

        case 'multiplechoicemultiple': {
            let mmInput = '<fieldset><legend>Choose your answers:</legend>';

            if (self.quiz.random) {
                shuffle(self.quiz.answers);
            }

            self.quiz.answers.forEach((answer, i) => {
                let cleanMMValue = SBPLUS.sanitize(answer.value);

                if (!SBPLUS.isEmpty(answer.img)) {
                    cleanMMValue = SBPLUS.sanitize(answer.img);
                    mmInput += '<label class="img_val" for="' + cleanMMValue + '"><input type="checkbox" id="' + cleanMMValue + '" name="mm" value="' + i + '" /><img src="' + SBPLUS.assetsPath + 'images/' + answer.img + '" alt="' + answer.value + '"/></label>';
                    return;
                }

                if (!SBPLUS.isEmpty(answer.audio)) {
                    cleanMMValue = SBPLUS.sanitize(answer.audio);
                    mmInput += '<label class="au_val" for="' + cleanMMValue + '"><input type="checkbox" id="' + cleanMMValue + '" name="mm" value="' + i + '" /> <audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + answer.audio + '" type="audio/mpeg"/></audio></label>';
                    return;
                }

                mmInput += '<label for="' + cleanMMValue + '"><input type="checkbox" id="' + cleanMMValue + '" name="mm" value="' + i + '" /> ' + answer.value + '</label>';
            });

            mmInput += '</fieldset>';
            if (inputContainer) {
                inputContainer.innerHTML = mmInput;
            }
            break;
        }

        case 'shortanswer':
            if (inputContainer) {
                inputContainer.innerHTML = '<label class="for_text" for="quiz_response">Enter your response</label><textarea id="quiz_response"></textarea>';
            }
            break;

        case 'fillintheblank':
            if (inputContainer) {
                inputContainer.innerHTML = '<label class="for_text" for="quiz_response">Enter your response</label><input id="quiz_response" type="text" />';
            }
            break;
    }

    const submitBtn = container.querySelector('button.sbplus_quiz_submit_btn');
    if (!submitBtn) {
        return;
    }

    submitBtn.addEventListener('click', function () {
        switch (self.quiz.type) {
            case 'multiplechoicesingle': {
                const checked = container.querySelector('input[type="radio"]:checked');
                quizTracker[self.qIndex].stuAnswer = checked ? checked.value : '';

                if (!SBPLUS.isEmpty(quizTracker[self.qIndex].stuAnswer)) {
                    for (const answer of self.quiz.answers) {
                        if (answer.correct !== undefined) {
                            const sAnswer = SBPLUS.sanitize(self.quiz.answers[Number(quizTracker[self.qIndex].stuAnswer)].value);
                            quizTracker[self.qIndex].correct = sAnswer === SBPLUS.sanitize(answer.value);
                            break;
                        }
                    }
                }
                break;
            }

            case 'multiplechoicemultiple': {
                const checkboxes = container.querySelectorAll('input[type="checkbox"][name="mm"]');
                const correctAnswers = [];

                quizTracker[self.qIndex].stuAnswer = [];

                checkboxes.forEach((checkbox) => {
                    if (checkbox.checked) {
                        quizTracker[self.qIndex].stuAnswer.push(Number(checkbox.value));
                    }
                });

                self.quiz.answers.forEach((answer) => {
                    if (answer.correct !== undefined) {
                        correctAnswers.push(SBPLUS.sanitize(answer.value));
                    }
                });

                if (quizTracker[self.qIndex].stuAnswer.length < correctAnswers.length || quizTracker[self.qIndex].stuAnswer.length > correctAnswers.length) {
                    quizTracker[self.qIndex].correct = false;
                } else if (quizTracker[self.qIndex].stuAnswer.length === correctAnswers.length) {
                    quizTracker[self.qIndex].correct = true;

                    for (let i = 0; i < quizTracker[self.qIndex].stuAnswer.length; i++) {
                        const index = Number(quizTracker[self.qIndex].stuAnswer[i]);
                        const mAnswer = SBPLUS.sanitize(quizTracker[self.qIndex].answers[index].value);

                        if (!correctAnswers.includes(mAnswer)) {
                            quizTracker[self.qIndex].correct = false;
                            break;
                        }
                    }
                }
                break;
            }

            case 'shortanswer': {
                const textarea = container.querySelector('.sbplus_quiz_input textarea');
                quizTracker[self.qIndex].stuAnswer = textarea ? textarea.value : '';
                break;
            }

            case 'fillintheblank': {
                const input = container.querySelector('input');
                quizTracker[self.qIndex].stuAnswer = input ? input.value : '';
                quizTracker[self.qIndex].correct = quizTracker[self.qIndex].stuAnswer === self.quiz.answer;
                break;
            }
        }

        let containsAnswer = false;

        if (Array.isArray(quizTracker[self.qIndex].stuAnswer)) {
            containsAnswer = quizTracker[self.qIndex].stuAnswer.length >= 1;
        } else if (!SBPLUS.isEmpty(quizTracker[self.qIndex].stuAnswer)) {
            containsAnswer = true;
        }

        if (!containsAnswer) {
            const header = container.querySelector('.sbplus_quiz_header');
            if (!header) {
                return;
            }

            const error = document.createElement('div');
            error.className = 'quiz_error';
            error.innerHTML = '<span class="icon-warning"></span> Please answer the question before submitting.';
            header.insertAdjacentElement('afterend', error);

            window.setTimeout(() => {
                if (error.parentNode) {
                    error.parentNode.removeChild(error);
                }
            }, 5000);
        } else {
            self.renderFeedback();

            if (SBPLUS.xml.settings.mathjax === 'on' || SBPLUS.xml.settings.mathjax === 'true') {
                MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
            }
        }
    });
};

/**
 * Evaluates learner input, stores result state, and renders feedback content.
 * @returns {void}
 */
Quiz.prototype.renderFeedback = function () {
    const self = this;
    const container = document.querySelector(self.quizContainer);

    if (!container) {
        return;
    }

    let questionImg = '';
    let questionAudio = '';
    let html = '<div class="sbplus_quiz_header"><span class="icon-assessment"></span>';
    html += ' Self Assessment Feedback</div>';

    if (self.quiz.type !== 'shortanswer') {
        if (quizTracker[self.qIndex].correct) {
            html += '<div class="quiz_correct" role="alert"><span class="icon-check"></span> Correct!</div>';
        } else {
            html += '<div class="quiz_incorrect" role="alert"><span class="icon-warning"></span> Incorrect!</div>';
        }
    }

    if (!SBPLUS.isEmpty(self.quiz.questionImg)) {
        questionImg = '<p><img src="' + SBPLUS.assetsPath + 'images/' + self.quiz.questionImg + '" /></p>';
    }

    if (!SBPLUS.isEmpty(self.quiz.questionAudio)) {
        questionAudio = '<p><audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + self.quiz.questionAudio + '" type="audio/mpeg" /></audio></p>';
    }

    html += '<div class="sbplus_quiz_question">' + questionImg + questionAudio + self.quiz.question + '</div>';
    html += '<div class="sbplus_quiz_result">';

    switch (self.quiz.type) {
        case 'shortanswer':
            html += '<p><strong>Your answer:</strong><br>' + SBPLUS.escapeHTMLAttribute(String(quizTracker[self.qIndex].stuAnswer)) + '</p>';

            if (!SBPLUS.isEmpty(self.quiz.feedback)) {
                html += '<p><strong>Feedback:</strong><br>' + self.quiz.feedback + '</p>';
            }
            break;

        case 'fillintheblank':
            html += '<p><strong>Your answer:</strong><br>' + SBPLUS.escapeHTMLAttribute(String(quizTracker[self.qIndex].stuAnswer)) + '</p>';
            html += '<p><strong>Correct answer:</strong><br>' + self.quiz.answer + '</p>';

            if (quizTracker[self.qIndex].correct) {
                if (!SBPLUS.isEmpty(self.quiz.correctFeedback)) {
                    html += '<p><strong>Feedback:</strong><br>' + self.quiz.correctFeedback + '</p>';
                }
            } else if (!SBPLUS.isEmpty(self.quiz.incorrectFeedback)) {
                html += '<p><strong>Feedback:</strong><br>' + self.quiz.incorrectFeedback + '</p>';
            }
            break;

        case 'multiplechoicesingle': {
            const msAnswerIndex = Number(quizTracker[self.qIndex].stuAnswer);
            const msAnswerNode = quizTracker[self.qIndex].answers[msAnswerIndex];
            const msAnswer = msAnswerNode.value;
            const msFeedback = msAnswerNode.feedback;
            const msAnswerImg = msAnswerNode.img;
            const msAnswerAudio = msAnswerNode.audio;
            let msAnswerType = 'text';

            if (!SBPLUS.isEmpty(msAnswerImg)) {
                msAnswerType = 'img';
            }

            if (!SBPLUS.isEmpty(msAnswerAudio)) {
                msAnswerType = 'audio';
            }

            switch (msAnswerType) {
                case 'img':
                    html += '<p><strong>Your answer:</strong><br><img src="' + SBPLUS.assetsPath + 'images/' + msAnswerNode.img + '" alt="' + msAnswerNode.value + '" /></p>';
                    break;

                case 'audio':
                    html += '<p><strong>Your answer:</strong><br><audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + msAnswerAudio + '" type="audio/mpeg"/></audio></p>';
                    break;

                case 'text':
                    html += '<p><strong>Your answer:</strong><br>' + msAnswer + '</p>';
                    break;
            }

            for (let i = 0; i < self.quiz.answers.length; i++) {
                if (self.quiz.answers[i].correct !== undefined) {
                    let output = self.quiz.answers[i].value;

                    switch (msAnswerType) {
                        case 'img':
                            output = '<img src="' + SBPLUS.assetsPath + 'images/' + self.quiz.answers[i].img + '" alt="' + self.quiz.answers[i].value + '" />';
                            break;

                        case 'audio':
                            output = '<audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + self.quiz.answers[i].value + '" type="audio/mpeg"/></audio>';
                            break;
                    }

                    if (quizTracker[self.qIndex].correct || !self.quiz.retry) {
                        html += '<p><strong>Correct answer:</strong><br>' + output + '</p>';
                    }

                    break;
                }
            }

            if (!SBPLUS.isEmpty(msFeedback)) {
                html += '<p><strong>Feedback:</strong><br>' + msFeedback + '</p>';
            }

            if (!quizTracker[self.qIndex].correct && self.quiz.retry) {
                html += '<p><button class="sbplus_quiz_tryagain_btn">Try Again</button></p>';
            }
            break;
        }

        case 'multiplechoicemultiple': {
            const stuAnswerAry = quizTracker[self.qIndex].stuAnswer;

            html += '<p><strong>Your answer:</strong><br>';

            stuAnswerAry.forEach((answerIndex) => {
                const saIndex = Number(answerIndex);
                let mmAnswerType = 'text';

                if (!SBPLUS.isEmpty(self.quiz.answers[saIndex].img)) {
                    mmAnswerType = 'img';
                }

                if (!SBPLUS.isEmpty(self.quiz.answers[saIndex].audio)) {
                    mmAnswerType = 'audio';
                }

                switch (mmAnswerType) {
                    case 'img':
                        html += '<img src="' + SBPLUS.assetsPath + 'images/' + self.quiz.answers[saIndex].img + '" alt="' + self.quiz.answers[saIndex].value + '" /><br>';
                        break;

                    case 'audio':
                        html += '<audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + self.quiz.answers[saIndex].value + '" type="audio/mpeg"/></audio><br>';
                        break;

                    case 'text':
                        html += self.quiz.answers[saIndex].value + '<br>';
                        break;
                }
            });

            if (quizTracker[self.qIndex].correct || !self.quiz.retry) {
                html += displayCorrectMultipleAnswers(self.quiz.answers);
            }

            if (quizTracker[self.qIndex].correct) {
                if (!SBPLUS.isEmpty(self.quiz.correctFeedback)) {
                    html += '<p><strong>Feedback:</strong><br>' + self.quiz.correctFeedback + '</p>';
                }
            } else if (!SBPLUS.isEmpty(self.quiz.incorrectFeedback)) {
                html += '<p><strong>Feedback:</strong><br>' + self.quiz.incorrectFeedback + '</p>';
            }

            if (!quizTracker[self.qIndex].correct && self.quiz.retry) {
                html += '<p><button class="sbplus_quiz_tryagain_btn">Try Again</button></p>';
            }

            break;
        }
    }

    html += '</div>';

    container.innerHTML = html;

    const tryAgainBtn = container.querySelector('button.sbplus_quiz_tryagain_btn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function () {
            quizTracker[self.qIndex].stuAnswer = '';
            self.renderQuiz();
        });
    }
};

/**
 * Builds a human-readable list of correct answers for multiple-answer quizzes.
 * @param {Array<Object>} answers Answer objects from quiz state.
 * @returns {string}
 */
function displayCorrectMultipleAnswers(answers) {
    let result = '</p><p><strong>Correct answer:</strong><br>';

    answers.forEach((answer) => {
        if (answer.correct === undefined) {
            return;
        }

        let aType = 'text';

        if (!SBPLUS.isEmpty(answer.img)) {
            aType = 'img';
        }

        if (!SBPLUS.isEmpty(answer.audio)) {
            aType = 'audio';
        }

        switch (aType) {
            case 'img':
                result += '<img src="' + SBPLUS.assetsPath + 'images/' + answer.img + '" alt="' + answer.value + '" /><br>';
                break;

            case 'audio':
                result += '<audio controls><source src="' + SBPLUS.assetsPath + 'audio/' + answer.value + '" type="audio/mpeg"/></audio><br>';
                break;

            case 'text':
                result += answer.value + '<br>';
                break;
        }
    });

    result += '</p>';
    return result;
}

/**
 * Checks whether a quiz id already exists in the in-memory tracker.
 * @param {number} id Quiz identifier.
 * @returns {boolean}
 */
function questionExists(id) {
    for (let i = 0; i < quizTracker.length; i++) {
        if (quizTracker[i].id === id) {
            return true;
        }
    }

    return false;
}

/**
 * Randomizes an array in place using Fisher-Yates shuffle.
 * @param {Array<any>} array Source array.
 * @returns {Array<any>}
 */
function shuffle(array) {
    let randomIndex;
    let temp;

    for (let index = array.length; index; index--) {
        randomIndex = Math.floor(Math.random() * index);

        temp = array[index - 1];
        array[index - 1] = array[randomIndex];
        array[randomIndex] = temp;
    }
}

/**
 * Finds the tracker index for a quiz id.
 * @param {Array<Object>} array Quiz tracker array.
 * @param {number} id Quiz id to find.
 * @returns {number}
 */
function getCurrentQuizItem(array, id) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].id === id) {
            return i;
        }
    }

    return undefined;
}

export { Quiz };
