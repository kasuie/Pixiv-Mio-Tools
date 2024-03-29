/*
 * @Author: kasuie
 * @Date: 2024-03-29 11:47:52
 * @LastEditors: kasuie
 * @LastEditTime: 2024-03-29 18:07:50
 * @Description:
 */

(function () {
  "use strict";

  const format = (v, date, mode, uid, uploadName) => {
    let tags = v?.tags || [];
    let pageCount = +v.illust_page_count;
    let pathDate = null,
      pixAvatar = null,
      exts = [];
    if (v.attr == "original" && !tags.includes("original")) {
      tags.push("原创");
      tags.push("original");
    }
    if (tags?.length) {
      tags = tags.filter((vv) => {
        return (
          vv &&
          !vv.includes("收藏") &&
          !vv.includes("users") &&
          !vv.includes("bookmarks") &&
          !vv.includes("Bookmarks") &&
          !vv.includes("R-18")
        );
      });
    }
    const matches = v.url.match(
      /\/(\d{4}\/\d{2}\/\d{2}\/\d{2}\/\d{2}\/\d{2})\//
    );
    if (matches && matches[1]) {
      pathDate = matches[1];
    }
    const extArr = v.url?.split(".");
    if (extArr?.length) {
      const ext = extArr[extArr.length - 1];
      for (let index = 0; index < pageCount; index++) {
        exts.push(ext);
      }
    }
    pixAvatar = v.profile_img
      ?.replace("https://i.pximg.net", "")
      ?.replace("_50", "");

    return {
      pid: v.illust_id,
      uid: v.user_id,
      author:
        v.user_name
          ?.replace(/＠(.*)/, "")
          ?.replace(/@(.*)/, "")
          ?.replace(/❤(.*)/, "")
          ?.replace(/■(.*)/, "")
          ?.replace(/▶(.*)/, "") || v.user_name,
      rankType: mode,
      tags: tags?.join(","),
      exts: exts?.join(","),
      pageCount: pageCount,
      title: v.title,
      datePath: pathDate,
      pixAvatar,
      width: v.width,
      height: v.height,
      aspectRatio: Math.round((v.width / v.height) * 1000) / 1000,
      createDate: new Date(
        new Date(v.illust_upload_timestamp * 1000).toLocaleString("chinese", {
          hour12: false,
        })
      ),
      viewCount: v.view_count,
      ratingCount: v.rating_count,
      illusType: +v.illust_type,
      uploadName: uploadName,
      uploadUid: uid,
      status: v?.is_bookmarked ? v.yes_rank - 101 : v.yes_rank,
      startDate: v.yes_rank == 0 ? `${date}_${v.yes_rank}:${v.rank}` : null,
      endDate: v.yes_rank > 0 ? `${date}_${v.yes_rank}:${v.rank}` : null,
    };
  };

  const request = (data) => {
    return new Promise((resolve, reject) => {
      if (!data.method) {
        data.method = "get";
      }
      if (!data.timeout) {
        data.timeout = 10000;
      }
      data.onload = function (res) {
        try {
          resolve(JSON.parse(res.responseText));
        } catch (error) {
          reject(false);
        }
      };
      data.onerror = function (e) {
        reject(false);
      };
      data.ontimeout = function () {
        reject(false);
      };
      GM.xmlHttpRequest(data);
    });
  };

  const getRankAndToMio = (_e) => {
    const urlParams = new URLSearchParams(window.location.search);
    let mode = urlParams.get("mode"),
      date = urlParams.get("date");
    let data = [],
      url = `/ranking.php?format=json`,
      uid = null;

    if (mode) url = `${url}&mode=${mode}`;
    if (date) url = `${url}&date=${date}`;

    const userDom = document.querySelector("div.sc-1asno00-0");
    const uploadName = userDom.getAttribute("title");

    const page_1 = request({
      method: "GET",
      url: `${url}&p=1`,
      headers: {
        referer: "https://www.pixiv.net/",
        "Accept-Language:":
          "zh-CN,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,en,en-CN;q=0.6",
      },
    });

    const page_2 = request({
      method: "GET",
      url: `${url}&p=2`,
      headers: {
        referer: "https://www.pixiv.net/",
        "Accept-Language:":
          "zh-CN,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,en,en-CN;q=0.6",
      },
    });

    Promise.all([page_1, page_2])
      .then(([res_1, res_2]) => {
        if (res_1 && res_2) {
          const { contents: page1, date: date1, mode: mode1 } = res_1;
          const {
            contents: page2,
            date: date2,
            mode: mode2,
            prev_date,
            next_date,
          } = res_2;
          if (date1 == date2 && mode1 == mode2) {
            [...page1, ...page2].forEach((ele) => {
              if (+ele?.illust_type == 0) {
                data.push(format(ele, date1, mode1, uid, uploadName));
              }
            });
            return {
              rankDate: date1,
              prevDate: prev_date,
              nextDate: next_date,
              rankType: mode1,
              uploadName,
              rankList: data,
            };
          }
        }
      })
      .then((params) => {
        console.log("mio请求参数：", params);
        content.innerText = params.rankList.length;
        request({
          method: "POST",
          url: "https://kasuie.cc/apis/prank/newDate",
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify(params),
        }).then((res) => {
          console.log("请求mio结果：", res);
          GM.notification(res.message);
        }).finally(() => {
          onLoading(false);
        });
      }).finally(() => {
        onLoading(false);
      });
  };

  /** 操作按钮组 */
  const actions = document.createElement("div");
  /** 弹框内容 */
  const content = document.createElement("div");
  /** 提交到mio按钮 */
  const addMio = document.createElement("button");
  /** 关闭弹框按钮 */
  const span = document.createElement("span");

  const html = document.querySelector("html");

  /** 弹框遮罩 */
  const div = document.createElement("div");
  div.id = "mio-tools";

  /** 弹框 */
  const main = document.createElement("div");
  main.className = "mio-tools-main";

  const onLoading = (loading) => {
    if (loading) {
      addMio.disabled = true;
    } else {
      addMio.disabled = false;
    }
  };

  const onModalChange = () => {
    if (div.classList.contains("mio-tools-open")) {
      html.style.overflow = "unset";
      div.classList.remove("mio-tools-open");
    } else {
      html.style.overflow = "hidden";
      div.classList.add("mio-tools-open");
    }
  };

  span.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
  `;
  span.className = "mio-tools-main-close";
  span.addEventListener("click", (_e) => onModalChange());

  addMio.innerText = "抓取并提交Mio";
  addMio.className = "mio-btn-add";
  addMio.addEventListener("click", (_e) => {
    onLoading(true);
    getRankAndToMio(_e);
  });

  actions.className = "mio-tools-main-btns";
  actions.appendChild(addMio);

  content.className = "mio-tools-main-content";
  main.appendChild(span);
  main.appendChild(content);
  main.appendChild(actions);

  div.appendChild(main);

  const btn = document.createElement("button");
  btn.id = "mio-tools-btn";
  btn.style.position = "fixed";
  btn.style.right = 0;
  btn.style.top = "45%";
  btn.addEventListener("click", (_e) => onModalChange());
  btn.innerHTML = "Mio Start";

  document.querySelector("body").appendChild(btn);

  GM.addStyle(`
    #mio-tools-btn { 
        border-radius: 16px;
        width: 50px;
        height: 50px;
        outline: none;
        border: none;
        padding: 6px 10px;
        z-index: 10;
    }
    #mio-tools {     
        position: fixed;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 0;
        height: 0;
        overflow: hidden;
        top: 0;
        right: 0;
        background: #00000080;
        backdrop-filter: blur(2px);
        z-index: 99;
     }
    .mio-tools-open {
        width: 100% !important;
        height: 100vh !important;
        
        > .mio-tools-main {
            position: relative;
            background: #010101;
            width: 600px;
            height: 300px;
            border-radius: 16px;    
            padding: 32px;
            transition: all .1s ease-in-out;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 16px;

            .mio-tools-main-close {
                position: absolute;
                right: 10px;
                top: 10px;
                color: #0097fa;
                cursor: pointer;

                &:hover {
                    transform: scale(1.1);
                }
            }

            .mio-tools-main-content {
                flex: 1;
            }

            .mio-tools-main-btns {
                text-align: end;

                .mio-btn-add {
                    outline: none;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 10px;
                    cursor: pointer;
                    background: #0097fa;
                    color: #ebebeb;
                }
            }
        }
    }
  `);

  document.querySelector("body").appendChild(div);
})();
