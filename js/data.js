// js/data.js

const KEY = "maintenance-demo-v1";

const INITIAL_RECORDS = [
    { id: 1, title: "Broken classroom light", category: "Electrical", description: "The light in Room B12 does not switch on.", status: "Pending" },
    { id: 2, title: "Leaking sink in restroom", category: "Plumbing", description: "Water is continuously dripping from the second-floor tap.", status: "In progress" },
    { id: 3, title: "Broken lecture chair", category: "Furniture", description: "The writing tablet on chair row 3 is detached.", status: "Completed" },
    { id: 4, title: "Projector power fault", category: "Electrical", description: "Main lecture theater projector loses HDMI signal intermittently.", status: "Pending" },
    { id: 5, title: "Clogged corridor drain", category: "Plumbing", description: "Water pooling near the science lab entrance after heavy rain.", status: "Pending" },
    { id: 6, title: "Wobbly office desk", category: "Furniture", description: "Front leg of the desk in faculty office 4 needs tightening.", status: "Completed" },
    { id: 7, title: "Exposed power socket", category: "Electrical", description: "Wall socket loose from housing in hallway C.", status: "In progress" },
    { id: 8, title: "Broken window latch", category: "Furniture", description: "Library reading room window cannot be locked securely.", status: "Pending" }
];

function getStoredRecords() {
    const data = localStorage.getItem(KEY);
    if (!data) {
        localStorage.setItem(KEY, JSON.stringify(INITIAL_RECORDS));
        return [...INITIAL_RECORDS];
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length === 0) {
        localStorage.setItem(KEY, JSON.stringify(INITIAL_RECORDS));
        return [...INITIAL_RECORDS];
    }
    return parsed;
}

function saveStoredRecords(records) {
    localStorage.setItem(KEY, JSON.stringify(records));
}

export const recordService = {
    async list() {
        return getStoredRecords();
    },

    async get(id) {
        const records = getStoredRecords();
        const record = records.find(r => r.id === Number(id));
        if (!record) {
            throw new Error(`Record with id ${id} is missing.`);
        }
        return record;
    },

    async create(newRecordData) {
        const records = getStoredRecords();
        const maxId = records.reduce((max, r) => (r.id > max ? r.id : max), 0);
        const newId = maxId + 1;

        const record = {
            id: newId,
            title: newRecordData.title.trim(),
            category: newRecordData.category.trim(),
            description: newRecordData.description.trim(),
            status: newRecordData.status
        };

        records.push(record);
        saveStoredRecords(records);
        return record;
    },

    async update(id, updatedData) {
        const records = getStoredRecords();
        const index = records.findIndex(r => r.id === Number(id));
        if (index === -1) {
            throw new Error(`Record with id ${id} not found for updating.`);
        }

        records[index] = {
            id: Number(id),
            title: updatedData.title.trim(),
            category: updatedData.category.trim(),
            description: updatedData.description.trim(),
            status: updatedData.status
        };

        saveStoredRecords(records);
        return records[index];
    },

    async remove(id) {
        let records = getStoredRecords();
        const exists = records.some(r => r.id === Number(id));
        if (!exists) {
            throw new Error(`Record with id ${id} not found for deletion.`);
        }
        records = records.filter(r => r.id !== Number(id));
        saveStoredRecords(records);
        return { success: true, message: "Record deleted successfully." };
    }
};