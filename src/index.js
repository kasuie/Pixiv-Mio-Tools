/*
 * @Author: kasuie
 * @Date: 2024-03-29 11:47:52
 * @LastEditors: kasuie
 * @LastEditTime: 2024-04-03 18:09:19
 * @Description:
 */

(function () {
  "use strict";

  let DEV = false;

  let DATE = "";

  let mioDates = "";

  const isArtwork = () => {
    if (
      window.location.pathname &&
      window.location.pathname.includes("artworks")
    ) {
      const pathname = window.location.pathname.split("/");
      if (pathname?.length) {
        return +pathname[pathname.length - 1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

  const pid = isArtwork();

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

    if (v.profile_img && !v.profile_img.includes("no_profile")) {
      pixAvatar = v.profile_img
        ?.replace("https://i.pximg.net/user-profile/img/", "")
        ?.replace("_50", "");
    }

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
      exts: exts[0],
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

  const formatIllust = (image) => {

    const {
      id,
      height,
      width,
      aiType,
      pageCount,
      urls,
      createDate,
      bookmarkCount,
      illustType,
      title,
      tags: { tags: tagsObj },
      userName: author,
      userId: uid,
      userAccount: account,
    } = image;

    let pathDate = null,
      avatar = null,
      pixAvatar = null,
      ext = null,
      tags = [],
      r18 = 0;

    const divAvatar = document.querySelector(`a[href="/users/${uid}"]`);
  
    if(divAvatar) {
      const src = divAvatar.querySelector("img")?.src || null;
      if(src) {
        pixAvatar = src.replace("https://i.pximg.net/user-profile/img/", "")
        ?.replace("_170", "");
      }
    }

    if (urls && urls.original) {
      let matches = urls.original.match(
        /\/(\d{4}\/\d{2}\/\d{2}\/\d{2}\/\d{2}\/\d{2})\//
      );
      if (matches && matches[1]) {
        pathDate = matches[1];
      }
      const arrs = urls.original.split(".");
      ext = arrs[arrs.length - 1];
    }

    if (tagsObj?.length) {
      tagsObj.forEach((v) => {
        if (r18 != 1 && v.tag.includes("R-18")) {
          return (r18 = 1);
        }
        if (
          v.tag.includes("收藏") ||
          v.tag.includes("users") ||
          v.tag.includes("bookmarks") ||
          v.tag.includes("Bookmarks")
        ) {
          return;
        }
        if (
          aiType != 2 &&
          (v.tag.includes("AIイラスト") || v.tag.includes("ai绘图"))
        ) {
          aiType = 2;
        }
        if(v.tag) {
          tags.push(v.tag);
        }
        if (v.translation && v.translation.en) {
          tags.push(v.translation.en);
        }
      });
    }

    return {
      pid: +id,
      pixAccount: account,
      height,
      width,
      aiType,
      pageCount,
      createDate,
      bookmarks: bookmarkCount,
      pixAvatar,
      title,
      uid,
      ext,
      author:
        author
          ?.replace(/＠(.*)/, "")
          ?.replace(/@(.*)/, "")
          ?.replace(/❤(.*)/, "")
          ?.replace(/■(.*)/, "")
          ?.replace(/▶(.*)/, "") || author,
      pathDate,
      tags: tags,
    };
  };

  const getDate = (prev, next, date) => {
    let currentDate = new Date();

    if (!prev && !next) {
      if (
        currentDate.getHours() > 12 ||
        (currentDate.getHours() === 12 && currentDate.getMinutes() > 0)
      ) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        currentDate.setDate(currentDate.getDate() - 2);
      }
    } else if (date) {
      const year = date.slice(0, 4);
      const month = date.slice(4, 6) - 1;
      const day = date.slice(6, 8);
      currentDate = new Date(year, month, day);
      if (prev) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
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
    if (!onCheckDate()) return;
    const urlParams = new URLSearchParams(window.location.search);
    let mode = urlParams.get("mode"),
      date = DATE;
    let data = [],
      url = `/ranking.php?format=json`,
      uid = null;

    if (mode) url = `${url}&mode=${mode}`;
    if (date) url = `${url}&date=${date}`;

    const userDom = document.querySelector("div.sc-1asno00-0");
    const uploadName = userDom.getAttribute("title");

    onLoading(true);

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
          if (DEV) {
            console.log("page1:", res_1, "page_2", res_2);
          }
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
              // if (+ele?.illust_type == 0) {
              data.push(format(ele, date1, mode1, uid, uploadName));
              // }
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
        if (DEV) {
          console.log("请求mio参数:", params);
          return null;
        }
        content.innerHTML =
          content.innerHTML +
          `
          <div class="mio-pro-msg" style="display: flex;flex-direction: column;gap: 10px;">
            <p>当前排行榜类型为：${params.rankType}</p>
            <p>过滤一些非插画类型，实际抓取数据量为：${params.rankList.length}条</p>
            <p>开始发送数据...</p>
            <p style="color: #69f769;" class="mio-result-message"></p>
          </div>
        `;
        request({
          method: "POST",
          url: "https://kasuie.cc/apis/prank/newDate",
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify(params),
        })
          .then((res) => {
            console.log("请求mio结果：", res);
            let msg = document.querySelector(".mio-result-message");
            if (res.success) {
              msg.innerHTML = "🎉好耶！发送数据成功~";
              if (mioDates) {
                GM.setValue("mio-dates", `${mioDates},${date}`);
                mioDates = `${mioDates},${date}`;
              } else {
                GM.setValue("mio-dates", date);
                mioDates = data;
              }
            } else {
              msg.style.color = "red";
              msg.innerHTML = "💔发送失败惹";
            }
            GM.notification(res.message);
          })
          .finally(() => {
            onLoading(false);
          });
      })
      .finally(() => {
        onLoading(false);
      });
  };

  const getArtworkAndToMio = (_e) => {
    console.log("pid", pid);
  };

  const getArtwork = () => {
    request({
      method: "GET",
      url: `/ajax/illust/${pid}`,
      headers: {
        referer: "https://www.pixiv.net/",
        "Accept-Language:":
          "zh-CN,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7,en,en-CN;q=0.6",
      },
    }).then((res) => {
      console.log("res", res);
      if (!res.error) {
        const artwork = formatIllust(res.body);
        console.log(artwork, "artwork");
        content.innerHTML = `
            <p>Pid：${artwork.pid} 画师：${artwork.author}</P>
            <p>标题：${artwork.title}</P>
            <p>标签：${artwork.title}</P>
            `;
      }
    });
  };

  const NOW = getDate();

  /** 操作按钮组 */
  const actions = document.createElement("div");
  /** 弹框内容 */
  const content = document.createElement("div");
  /** 提交到mio按钮 */
  const addMio = document.createElement("button");
  /** 提交到mio按钮 */
  const prevBtn = document.createElement("button");
  /** 提交到mio按钮 */
  const nextBtn = document.createElement("button");
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

  const onModalChange = async () => {
    if (div.classList.contains("mio-tools-open")) {
      html.style.overflow = "unset";
      div.classList.remove("mio-tools-open");
      content.innerHTML = null;
    } else {
      mioDates = await GM.getValue("mio-dates", "");
      html.style.overflow = "hidden";
      div.classList.add("mio-tools-open");
      if (pid) {
        content.innerHTML = `
          <p style="color: #f5765c;" class="mio-error"></p>
          <p>正在获取：<span style="color: #69f769;" class="mio-date">${pid}</span>数据</p>
          `;
        getArtwork();
      } else {
        if (!DATE) {
          DATE = getDate();
        }
        if (NOW == DATE) {
          nextBtn.disabled = true;
        }
        content.innerHTML = `
          <p style="color: #f5765c;" class="mio-error"></p>
          <p>将要获取排行榜数据日期为：<span style="color: #69f769;" class="mio-date">${DATE}</span></p>
          `;
        onCheckDate();
      }
    }
  };

  const onCheckDate = () => {
    if (mioDates && mioDates.includes(DATE)) {
      const error = document.querySelector(".mio-error");
      error.innerText = "💤当前日期已抓取过~";
      return false;
    } else {
      const error = document.querySelector(".mio-error");
      error.innerText = "";
      return true;
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
    if (pid) {
      getArtworkAndToMio(_e);
    } else {
      getRankAndToMio(_e);
    }
  });
  prevBtn.innerText = "前一天";
  prevBtn.className = "mio-btn-prev";
  prevBtn.addEventListener("click", (_e) => {
    const mioDate = document.querySelector(".mio-date");
    const proMsg = content.querySelector(".mio-pro-msg");
    DATE = getDate(true, null, DATE);
    if (NOW != DATE && nextBtn.disabled) {
      nextBtn.disabled = false;
    }
    if (proMsg) {
      content.removeChild(proMsg);
    }
    mioDate.innerText = DATE;
    onCheckDate();
  });
  nextBtn.innerText = "后一天";
  nextBtn.className = "mio-btn-next";
  nextBtn.addEventListener("click", (_e) => {
    const mioDate = document.querySelector(".mio-date");
    if (NOW == DATE) {
      nextBtn.disabled = true;
    } else {
      DATE = getDate(null, true, DATE);
      const proMsg = content.querySelector(".mio-pro-msg");
      if (proMsg) {
        content.removeChild(proMsg);
      }
      mioDate.innerText = DATE;
      onCheckDate();
    }
  });

  actions.className = "mio-tools-main-btns";

  if (!pid) {
    actions.appendChild(prevBtn);
    actions.appendChild(nextBtn);
  }
  actions.appendChild(addMio);

  content.className = "mio-tools-main-content";
  main.appendChild(span);
  main.appendChild(content);
  main.appendChild(actions);

  div.appendChild(main);

  const btn = document.createElement("button");
  btn.id = "mio-tools-btn";
  btn.addEventListener("click", (_e) => onModalChange());
  btn.innerHTML = "Mio";

  document.querySelector("body").appendChild(btn);

  GM.addStyle(`
    html {
      &::-webkit-scrollbar {
        width: 4px;
        transition: all .3s ease-in-out;
      }
      &::-webkit-scrollbar-thumb {
        cursor: pointer;
        border-radius: 10px;
        transition: all .15s ease-in-out;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
      }
      &::-webkit-scrollbar-track {
        border-radius: 10px;
        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
        background: rgba(255, 255, 255, 0.05);
      }
      &::-webkit-scrollbar-thumb:hover {
        @apply bg-[#64d1e2];
      }
    }
    #mio-tools-btn {
        position: fixed;
        right: 0px;
        top: 85%;
        border-radius: 16px;
        width: 36px;
        height: 36px;
        outline: none;
        border: none;
        padding: 6px 10px;
        z-index: 10;
        background: #0097fac7;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #fff;
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
                color: #ffffff;
                cursor: pointer;
                rotate: 0deg;
                transition: all .3s ease-in-out;

                &:hover {
                    transform: scale(1.1);
                    color: #0097fa;
                    rotate: 180deg;
                }
            }

            .mio-tools-main-content {
                flex: 1;
                color: #ffffff;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .mio-tools-main-btns {
                display: flex;
                justify-content: flex-end;
                gap: 16px;

                .mio-btn-add, .mio-btn-prev, .mio-btn-next {
                    outline: none;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 10px;
                    cursor: pointer;
                    background: #0097fa;
                    color: #ebebeb;
                }

                button:disabled {
                  opacity: 0.7;
                  cursor: not-allowed;
                }
            }
        }
    }
  `);

  document.querySelector("body").appendChild(div);
})();
