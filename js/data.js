import { config } from "./config.js";

async function request(path, method = "GET", body) {
    const options = { method };

    if (body !== undefined) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({
            title: body.title?.trim(),
            category: body.category?.trim(),
            description: body.description?.trim(),
            status: body.status
        });
    }

    let response;
    try {
        response = await fetch(`${config.backendBaseUrl}${path}`, options);
    } catch {
        throw new Error("Unable to reach the server. Please check your connection.");
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error("Received an invalid response from the server.");
    }

    if (!response.ok) {
        throw new Error(data.message || "The request failed.");
    }

    return data;
}

export const recordService = {
    list() {
        return request("/api/records");
    },

    get(id) {
        return request(`/api/records/${id}`);
    },

    create(record) {
        return request("/api/records", "POST", record);
    },

    update(id, record) {
        return request(`/api/records/${id}`, "PUT", record);
    },

    remove(id) {
        return request(`/api/records/${id}`, "DELETE");
    }
};