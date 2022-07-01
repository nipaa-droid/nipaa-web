import { GetStaticProps } from "next";
import { assertDefined } from "../shared/assertions";
import Database from "../shared/database/Database";
import { OsuDroidStats } from "../shared/database/entities";

type LeaderboardData = {
  username: string;
  pp: string;
  acc: string;
  id: number;
};

type LeaderboardProps = {
  data: LeaderboardData[];
};

export const getStaticProps: GetStaticProps<LeaderboardProps> = async () => {
  await Database.getConnection();

  const stats = await OsuDroidStats.find({
    relations: ["user"],
    select: ["id", "pp", "accuracy"],
    order: {
      pp: "DESC",
    },
  });

  const data: LeaderboardData[] = stats.map((s) => {
    const { user } = s;

    assertDefined(user);
    assertDefined(user.username);

    return {
      username: user.username,
      pp: s.pp.toFixed(2),
      acc: s.accuracy.toFixed(2),
      id: s.id,
    };
  });

  return {
    props: {
      data,
    },
    revalidate: 60,
  };
};

const LeaderboardPage = ({ data }: LeaderboardProps) => {
  return (
    <div>
      <ol>
        {data.map((s) => {
          const { username, acc, pp, id } = s;
          return (
            <li key={id}>
              {username} {" -> "} {pp} {" -- acc: "} {acc}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default LeaderboardPage;
