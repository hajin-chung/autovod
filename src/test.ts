async function test1() {
  setTimeout(() => {
    console.log("hi");
  }, 1000);
  return 1;
}

const data = await test1();
console.log(data);
