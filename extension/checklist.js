'use strict';

const equals = require('deep-equal');
const clone = require('clone');
const obsWebsocket = require('./obs-websocket');

module.exports = function (nodecg) {
	// Create defaults array
	const checklistDefault = {
		extraContent: [
			{name: 'Check for Advertisement', complete: false},
			{name: 'Final Check', complete: false}
		],
		techStationDuties: [
			{name: 'Reset Timer', complete: false},
			{name: 'Cap card resolution', complete: false},
			{name: 'Cropping', complete: false},
			{name: 'Stream Layout button', complete: false},
			{name: 'Runner Info/Position', complete: false},
			{name: 'Webcam!', complete: false},
			{name: 'Twitch Dashboard/FFZ', complete: false}
		],
		otherDuties: [
			{name: 'Intermission music', complete: false},
			{name: 'Runner Game Audio', complete: false},
			{name: 'TVs have Video', complete: false},
			{name: 'Commentator Mics', complete: false},
			{name: 'Stream Audio', complete: false},
			{name: 'Steam Notifications Off', complete: false}
		]
	};

	// Instantiate replicant with defaults object, which will load if no persisted data is present.
	const checklist = nodecg.Replicant('checklist', {defaultValue: checklistDefault});

	// Reconcile differences between persisted value and what we expect the checklistDefault to be.
	const persistedValue = checklist.value;
	if (!equals(persistedValue, checklistDefault)) {
		const mergedChecklist = clone(checklistDefault);

		for (const category in checklistDefault) {
			if (!{}.hasOwnProperty.call(checklistDefault, category)) {
				continue;
			}

			mergedChecklist[category] = checklistDefault[category].map(task => {
				if (persistedValue[category]) {
					const persistedTask = persistedValue[category].find(({name}) => name === task.name);
					if (persistedTask) {
						return persistedTask;
					}
				}

				return task;
			});
		}

		checklist.value = mergedChecklist;
	}

	const checklistComplete = nodecg.Replicant('checklistComplete', {defaultValue: false});
	checklist.on('change', newVal => {
		let foundIncompleteTask = false;

		for (const category in newVal) {
			if (!{}.hasOwnProperty.call(newVal, category)) {
				continue;
			}

			foundIncompleteTask = newVal[category].some(task => !task.complete);

			if (foundIncompleteTask) {
				break;
			}
		}

		checklistComplete.value = !foundIncompleteTask;
	});

	return {
		reset() {
			obsWebsocket.resetCropping();
			for (const category in checklist.value) {
				if (!{}.hasOwnProperty.call(checklist.value, category)) {
					continue;
				}

				checklist.value[category].forEach(task => {
					task.complete = false;
				});
			}
		}
	};
};
