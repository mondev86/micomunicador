import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { deleteAudio, loadAudio, saveAudio } from "./audioDB";

describe("audioDB", () => {
  it("guarda y recupera una grabacion por favoriteId", async () => {
    const favoriteId = `fav-${Date.now()}-a`;
    const original = new Blob(["audio-data-1"], { type: "audio/webm" });

    await saveAudio(favoriteId, original);
    const loaded = await loadAudio(favoriteId);

    expect(loaded).not.toBeNull();
    expect(loaded?.type).toBe("audio/webm");
    expect(await loaded?.text()).toBe("audio-data-1");
  });

  it("sobrescribe una grabacion existente para el mismo favoriteId", async () => {
    const favoriteId = `fav-${Date.now()}-b`;
    const first = new Blob(["audio-v1"], { type: "audio/webm" });
    const second = new Blob(["audio-v2"], { type: "audio/webm" });

    await saveAudio(favoriteId, first);
    await saveAudio(favoriteId, second);

    const loaded = await loadAudio(favoriteId);
    expect(await loaded?.text()).toBe("audio-v2");
  });

  it("elimina la grabacion", async () => {
    const favoriteId = `fav-${Date.now()}-c`;
    const original = new Blob(["audio-data-delete"], { type: "audio/webm" });

    await saveAudio(favoriteId, original);
    await deleteAudio(favoriteId);

    const loaded = await loadAudio(favoriteId);
    expect(loaded).toBeNull();
  });
});
