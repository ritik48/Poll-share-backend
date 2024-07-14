import { getFormattedVote, getIsAlive, getTotalVotes } from "../models/Poll.js";

export function fillMissingDates(array, startDate, endDate) {
    const result = [...array];

    const start = new Date(startDate);
    const end = new Date(endDate);

    const dateSet = new Set(array.map((item) => item.day));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        console.log(d.toISOString());
        if (!dateSet.has(dateStr)) {
            result.push({ total: 0, day: dateStr });
        }
    }

    result.sort((a, b) => new Date(a.day) - new Date(b.day));
    return result;
}

export function addFiveThirtyToDate(dateStr = new Date().toISOString()) {
    const date = new Date(dateStr);

    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);

    return date;
}

export function pollWithExtraProperty(polls) {
    const modifiedPolls = JSON.parse(JSON.stringify(polls));

    for (let poll of modifiedPolls) {
        const isAlive = getIsAlive(poll);
        const formattedVote = getFormattedVote(poll);
        const total = getTotalVotes(poll);

        poll.total = total;
        poll.formattedVote = formattedVote;
        poll.isAlive = isAlive;
    }

    return modifiedPolls;
}
