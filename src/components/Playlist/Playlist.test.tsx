import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, test, vi } from "vitest";
import Playlist from "./Playlist";
const fallback = "/fallbacks/playlist-fallback.webp";
import { samplePlaylist } from "../../api/samples";

const fadeOutNavigate = vi.fn();
fadeOutNavigate.mockImplementation(() => {});
const playlistAlt = samplePlaylist.name;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

afterAll(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

describe("Playlist", () => {
  test("should render", async () => {
    render(
      <Playlist i={0} {...samplePlaylist} fadeOutNavigate={fadeOutNavigate} />,
    );
    expect(screen.getByTestId("playlist")).toBeInTheDocument();
  });
  test("should navigate on click", () => {
    render(
      <Playlist i={0} {...samplePlaylist} fadeOutNavigate={fadeOutNavigate} />,
    );
    const playlist = screen.getByTestId("playlist");
    fireEvent.click(playlist);
    expect(fadeOutNavigate).toHaveBeenCalledWith(
      `/playlists/${samplePlaylist.id}`,
    );
  });
  test("should contain image of size 150x150 if found", async () => {
    render(
      <Playlist
        {...{
          ...samplePlaylist,
          image: [
            {
              quality: "150x150",
              url: "image url",
            },
          ],
        }}
        i={0}
        fadeOutNavigate={fadeOutNavigate}
      />,
    );
    expect(screen.getByAltText(playlistAlt)).toHaveAttribute(
      "src",
      "image url",
    );
  });
  test("should contain fallback image if no image", async () => {
    render(
      <Playlist
        i={0}
        {...samplePlaylist}
        image={[]}
        fadeOutNavigate={fadeOutNavigate}
      />,
    );
    expect(screen.getByAltText(playlistAlt)).toHaveAttribute("src", fallback);
  });
  test("uses the fallback when playlist image data is unavailable", () => {
    render(
      <Playlist
        i={0}
        {...samplePlaylist}
        image={false as unknown as typeof samplePlaylist.image}
        fadeOutNavigate={fadeOutNavigate}
      />,
    );

    expect(screen.getByAltText(playlistAlt)).toHaveAttribute("src", fallback);
  });
  test("image should be it's fallback onError", async () => {
    render(
      <Playlist i={0} {...samplePlaylist} fadeOutNavigate={fadeOutNavigate} />,
    );
    fireEvent.error(screen.getByAltText(playlistAlt));
    expect(screen.getByAltText(playlistAlt)).toHaveAttribute("src", fallback);
  });
  test("image should have transition applied on mount", async () => {
    vi.useFakeTimers();
    render(
      <Playlist i={1} {...samplePlaylist} fadeOutNavigate={fadeOutNavigate} />,
    );
    const playlist = screen.getByTestId("playlist");
    expect(playlist).toBeInTheDocument();
    expect(playlist).toHaveClass("image-fadeout");
    expect(playlist).not.toHaveClass("image-fadein");
    vi.advanceTimersByTime(49);
    expect(playlist).toHaveClass("image-fadeout");
    vi.advanceTimersByTime(1);

    expect(playlist).toHaveClass("image-fadein");
    expect(playlist).not.toHaveClass("image-fadeout");
  });

  test("cancels the entry transition timer on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <Playlist i={2} {...samplePlaylist} fadeOutNavigate={fadeOutNavigate} />,
    );
    const playlist = screen.getByTestId("playlist");

    unmount();
    vi.advanceTimersByTime(100);

    expect(playlist).toHaveClass("image-fadeout");
    expect(playlist).not.toHaveClass("image-fadein");
  });
});
