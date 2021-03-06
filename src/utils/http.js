import {Loading, MessageBox} from 'element-ui';
import axios from 'axios';
import router from 'vue-router';

let alwaysPendingPromise = new Promise(() =>{});
let loadingInstance= "";
let loadingCount = 0;   //记录当前的loading有几个

export default function(userOptions,flag=false){
        let defaultOptions = {
                method: "get",
                headers: {
                        "Content-Type": "application/json",
                        "Authorization": sessionStorage.getItem("token")
                }
        };
        let options = Object.assign({}, defaultOptions, userOptions);

        if(options.data) options.data = JSON.stringify(options.data);

               loadingCount++;
           loadingInstance =  Loading.service({text: "loading..."});                  //开启loading效果

        return axios(options)
        // 故意延时1秒做loading效果
        //then函数的返回值一定是一个Promise对象，如果then里的参数是一个具体的值，
        //则then会自己封装一个成功的Promise对象并携带着这个值传递给下一个then
        //如果then里的参数的返回值是一个Promise对象，则then直接返回参数的Promise对象，自己就不再封装。
                .then(response =>{
                        return new Promise((resolve, reject) =>{
                                setTimeout(() =>{
                                        resolve(response);
                                }, 1000);
                        });
                })
                .then(async response =>{
                        if(response.status === 200){
                                switch(response.data.status){
                                        case 200:
                                            loadingCount-- === 1 && loadingInstance.close(); // 关闭loading效果
                                                return response.data.data;
                                        case 401:
                                                loadingCount-- === 1 &&  loadingInstance.close(); // 关闭loading效果
                                                sessionStorage.clear();
                                                await MessageBox.alert("登陆超时，请重新登录","提示",{type:"warning",showClose: false})
                                                this.$router.replace('/login');
                                                return alwaysPendingPromise;
                                        case 199:
                                        case 404:
                                        case 500:
                                                throw new Error(response.data.message);
                                }
                        }
                })
                .catch(error =>{
                        // 不管前面哪里错了，到我这里我希望收到一个错误对象，携带相关的错误信息，
                        // 我弹出来给用户看！！我兜底
                        if(flag){
                                this.$message({
                                        showClose: true,
                                        message: error.message,
                                        type: 'error'
                                });
                        }else{
                                MessageBox.alert(error.message, "提示", {type: "waring"})
                        }
                        loadingCount-- === 1 &&  loadingInstance.close(); // 关闭loading效果
                        return alwaysPendingPromise; // 返回一个永远是pending的promise不要让后面的then执行
                });
};