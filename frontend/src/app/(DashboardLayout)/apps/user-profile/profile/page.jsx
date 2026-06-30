import PageContainer from "@/app/components/container/PageContainer";

import UserInfoCard from "./UserInfoCard";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "UserProfile",
  },
];

const UserProfile = () => {
  return (
    <PageContainer title="Profile" description="User profile from backend">
      <UserInfoCard />
    </PageContainer>
  );
};

export default UserProfile;
