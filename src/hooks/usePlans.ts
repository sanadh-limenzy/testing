import { useQuery } from "@tanstack/react-query";

const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });
};

const getPlans = async () => {
  const response = await fetch("/api/plans");
  return response.json();
};

export default usePlans;
