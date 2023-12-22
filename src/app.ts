import { KintoneRestAPIClient } from '@kintone/rest-api-client'

const client = new KintoneRestAPIClient()
let fileKeyVar = ''
function generateHtmlFragment(fileKey: string) {
  // const attachHtmlTemplate = `
  // <div id="p1hi0h79b814iokk6kucnfsk487-pre"
  // class="plupload_delete input-file-thumbnail input-file-item-cybozu editable-file-item"
  // data-file-id="p1hi0h79b814iokk6kucnfsk487">
  // <div class="plupload_file_name" title="屏幕截图 2023-12-12 101722.png">
  // 屏幕截图 2023-12-12 101722.png
  // </div>
  // <div class="plupload_file_action">
  // <button id="p1hi0h79b814iokk6kucnfsk487-pre-remove" type="button"></button>
  // </div>
  // <div class="plupload_file_size">123 KB</div>
  // <div class="plupload_file_thumbnail_preview_img">
  // <img
  // src="/k/api/blob/download.do?fileKey=${fileKey}&amp;h=150&amp;w=150&amp;flag=SHRINK&amp;_ref=https%3A%2F%2Fcndevqpofif.cybozu.cn%2Fk%2F221%2Fedit"
  // alt="" title="屏幕截图 2023-12-12 101722.png" data-thumbnail-key="slide-11" class="gaia-ui-slideshow-thumbnail" />
  // </div>
  // <div class="plupload_clearer"></div>
  // </div>
  // `
  const attachHtmlTemplate = `
 
  <img
  src="/k/api/blob/download.do?fileKey=${fileKey}&amp;h=150&amp;w=150&amp;flag=SHRINK&amp;_ref=https%3A%2F%2Fcndevqpofif.cybozu.cn%2Fk%2F221%2Fedit"
  alt="" title="你上传的图片" data-thumbnail-key="slide-11" class="gaia-ui-slideshow-thumbnail" />
  `
  return attachHtmlTemplate
}

type AttachFiledCode = { [property: string]: string }

function extractFileTypes(obj: any) {
  let result: AttachFiledCode = {}
  for (let key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      if (obj[key].type === 'FILE') {
        result[key] = ''
      } else {
        let subResult = extractFileTypes(obj[key])
        if (Object.keys(subResult).length > 0) {
          result = { ...result, ...subResult }
        }
      }
    }
  }
  return result
}

function findAttachContainer() {
  const container = document.querySelector('.input-file-filelist-list-cybozu')
  if (container) {
    return container
  }
}

async function uploadFile(fileData: Blob) {
  // const APP_ID = '221'
  // const ATTACHMENT_FIELD_CODE = 'atta'
  const fileInfo = {
    name: 'Hello.png',
    data: fileData,
  }

  // Upload a file and attach it to a record
  const { fileKey } = await client.file.uploadFile({
    file: fileInfo,
  })
  console.log(fileKey)
  return fileKey
  // const result = await client.record.addRecord({
  //   app: APP_ID,
  //   record: {
  //     [ATTACHMENT_FIELD_CODE]: {
  //       value: [{ fileKey }],
  //     },
  //   },
  // })
  // console.log(result)
  // const id = result.id

  // const { record } = await client.record.getRecord({
  //   app: APP_ID,
  //   id,
  // })

  // type FileInformation = {
  //   contentType: string
  //   fileKey: string
  //   name: string
  //   size: string
  // }

  // const data = await client.file.downloadFile({
  //   fileKey: (record[ATTACHMENT_FIELD_CODE].value as FileInformation[])[0].fileKey,
  // })

  // console.log(data)
}

async function downFile(fileKey: string) {
  // Download a file
  const data = await client.file.downloadFile({
    fileKey: fileKey,
  })
  console.log(data)
}

async function readImageFromClipboard() {
  try {
    const clipboardItems = await navigator.clipboard.read()
    for (let clipboardItem of clipboardItems) {
      for (let type of clipboardItem.types) {
        if (/^image\/.*/.test(type)) {
          const blob = await clipboardItem.getType(type)
          return blob
        }
      }
    }
  } catch (err) {
    console.error('Failed to read clipboard contents: ', err)
  }
}

async function temp1(blob: Blob) {
  // console.log(blob.size)

  const fileKey = await uploadFile(blob)
  fileKeyVar = fileKey
  const htmlFragment = generateHtmlFragment(fileKey)
  const container = findAttachContainer()

  if (container) {
    // create a element with htmlFragment
    const div = document.createElement('div')
    div.innerHTML = htmlFragment

    // append after container
    container.appendChild(div.firstElementChild as HTMLElement)
  }

  let reader = new FileReader()
  reader.onload = function () {
    // console.log(this.result)

    let img = document.createElement('img')
    if (typeof this.result === 'string') {
      img.src = this.result
      // kintone unique structural processing
      // document.body.appendChild(img)
    }
  }
  reader.readAsDataURL(blob)
}

function generateAttachImageButton(attachFieldCodeList: AttachFiledCode) {
  // find all attach file container
  const containers = document.querySelectorAll('.input-file-filelist-cybozu.input-file-filelist-list-cybozu')
  // console.log(containers)
  // loop containers
  for (let container of Array.from(containers)) {
    console.log(container)
    // new a button
    let button = document.createElement('button')
    // set button text
    button.innerText = '读剪切板中图片'
    // button click event
    button.addEventListener('click', async () => {
      const blob = await readImageFromClipboard()
      if (blob) {
        uploadFile(blob)
      }
    })
    // add button to container
    container.appendChild(button)
  }
}

const app = () => {
  console.log('monkey jumping on the bed.')

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], (event) => {
    // step 1: 得到所有附件的字段代码
    let allAttachmentFieldCode = extractFileTypes(event.record)
    console.log(allAttachmentFieldCode)
    // step 2: 根据字段代码，生成【读剪切板中图片的按钮】，放在每个附件的元素里
    generateAttachImageButton(allAttachmentFieldCode)

    return event
  })
  setInterval(() => {
    // readImageFromClipboard()
  }, 10000)

  kintone.events.on('app.record.create.submit.success', async function (event) {
    const ATTACHMENT_FIELD_CODE = 'atta'

    const result = await client.record.updateRecord({
      app: event.appId,
      id: event.recordId,
      record: {
        [ATTACHMENT_FIELD_CODE]: {
          value: [{ fileKey: fileKeyVar }],
        },
      },
    })
    console.log(result)
    console.log(event)
    return event
  })
}

export default app
