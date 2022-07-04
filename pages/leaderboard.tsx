import { GetStaticProps } from "next";
import { Database } from "../shared/database/Database";
import { OsuDroidStats, OsuDroidUser } from "../shared/database/entities";
import { NonNullableKeys } from "../shared/utils/TypeUtils";

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
  const stats = await prisma.osuDroidStats.findMany({
    select: {
      id: true,
      pp: true,
      
    }
    include: {
      user: true
    } 
  })
  const stats = (await OsuDroidStats.find({
    relations: ["user"],
    select: ["id", "pp", "accuracy"],
    order: {
      pp: "DESC",
    },
  })) as (NonNullableKeys<
    Partial<OsuDroidStats>,
    ["user", "pp", "accuracy", "id"]
  > & { user: OsuDroidUser })[];

  const data: LeaderboardData[] = stats.map((s) => {
    const { user } = s;

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
