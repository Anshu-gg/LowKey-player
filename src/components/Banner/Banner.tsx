import { memo, useCallback, useEffect } from "react";
const logo = "/logo/sound-waves.webp";
import notifimg from "../../assets/svgs/bell-svgrepo-com.svg";
import { useBoundStore } from "../../modules/hooks";
import { ActivityType } from "../../types/GlobalTypes";

const Banner = memo(() => {
  const greeting = useBoundStore((state) => state.greeting);
  const changeGreeting = useBoundStore((state) => state.changeGreeting);

  const setGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 12) {
      changeGreeting("Good morning");
    } else if (hour > 12 && hour <= 15) {
      changeGreeting("Good afternoon");
    } else if (hour > 15 && hour <= 18) {
      changeGreeting("Good evening");
    } else if (hour > 18) {
      changeGreeting("Good night");
    } else {
      changeGreeting("Jump back in");
    }
  }, [changeGreeting]);

  useEffect(() => {
    if (greeting === "") setGreeting();
  }, [greeting, setGreeting]);

  return (
    <header className="flex h-12 w-full items-center justify-between bg-gradient-to-r from-neutral-800 to-black pl-2.5 pr-[18px] sm:border-b sm:border-black sm:bg-black">
      <p className="intro-out whitespace-nowrap px-1 text-base font-medium text-white">
        {greeting || "Keep jamming 🎶"}
      </p>
      <NotificationButton />
    </header>
  );
});
Banner.displayName = "Banner";
export default Banner;

const Activity = memo(({ message }: ActivityType) => {
  return (
    <li className="mb-0.5 line-clamp-1 flex h-[35px] w-full flex-shrink-0 items-center justify-start overflow-hidden text-ellipsis whitespace-nowrap rounded-sm bg-black px-2 focus:bg-neutral-700">
      <p className="mx-1 line-clamp-1 w-auto text-ellipsis text-xs font-medium text-neutral-300">
        {message}
      </p>
    </li>
  );
});
Activity.displayName = "Activity";

export const NotificationButton = memo(() => {
  const activity = useBoundStore((state) => state.recents.activity);
  const notifications = useBoundStore((state) => state.notifications);
  const setNotifications = useBoundStore((state) => state.setNotifications);

  const toggleNotifications = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (notifications) {
        setNotifications(false);
      } else {
        setNotifications(true);
      }
    },
    [notifications, setNotifications],
  );

  return (
    <div
      data-testid="notifs"
      className="flex w-auto items-center justify-between xl:justify-end"
    >
      <div className="flex w-10 items-center">
        <button
          type="button"
          tabIndex={0}
          onClick={toggleNotifications}
          className="relative h-6 w-6 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 xl:hidden"
        >
          <img
            src={notifimg}
            alt="notification"
            className="h-6 w-6"
            fetchPriority="high"
          />
          {activity?.length > 0 && !notifications && (
            <div className="absolute -top-0.5 right-0 h-2 w-2 rounded-full bg-emerald-500"></div>
          )}
        </button>
        <ul
          onMouseLeave={() => setNotifications(false)}
          className={`${
            notifications ? "absolute" : "hidden"
          } right-16 top-11 z-20 flex h-52 w-[300px] flex-col items-start justify-start overflow-y-scroll rounded-b-md rounded-tl-md bg-neutral-900 p-0.5 shadow-md shadow-black`}
        >
          {activity?.length > 0 ? (
            activity.map((a: ActivityType) => <Activity key={a.id} {...a} />)
          ) : (
            <p className="w-full pt-20 text-center text-sm">
              No new activity...¯\_(ツ)_/¯
            </p>
          )}
        </ul>
      </div>
      <img
        src={logo}
        alt="menu"
        fetchPriority="high"
        className="h-8 w-8 rounded-full"
      />
    </div>
  );
});
NotificationButton.displayName = "NotificationButton";
