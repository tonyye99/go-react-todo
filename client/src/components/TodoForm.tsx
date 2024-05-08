import { Button, Flex, Input, Spinner, useToast } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { IoMdAdd } from "react-icons/io";

const TodoForm = () => {
  const [newTodo, setNewTodo] = useState("");
  const toast = useToast();
  const query = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["createTodo"],
    mutationFn: async (createTodo: { title: string }) => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createTodo),
        });
        const response = await res.json();

        if (!res.ok) {
          throw new Error(response.message);
        }

        setNewTodo("");
        return response;
      } catch (error) {
        toast({
          title: "An error occurred.",
          description: (error as { message: string }).message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    },
    onSuccess: () => {
      query.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "An error occurred.",
        description: (error as { message: string }).message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    },
  });

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo) {
      return;
    }

    mutation.mutate({ title: newTodo });
  };

  return (
    <form onSubmit={createTodo}>
      <Flex gap={2}>
        <Input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          ref={(input) => input && input.focus()}
        />
        <Button
          mx={2}
          type="submit"
          _active={{
            transform: "scale(.97)",
          }}
        >
          {mutation.isPending ? <Spinner size={"xs"} /> : <IoMdAdd size={30} />}
        </Button>
      </Flex>
    </form>
  );
};
export default TodoForm;
