import { KintoneRestAPIClient } from '@kintone/rest-api-client'

const client = new KintoneRestAPIClient()
let fileKeyVar = ''
function generateHtmlFragment(fileKey: string) {
  const attachHtmlTemplate = `
  <div id="p1hi0h79b814iokk6kucnfsk487-pre"
  class="plupload_delete input-file-thumbnail input-file-item-cybozu editable-file-item"
  data-file-id="p1hi0h79b814iokk6kucnfsk487">
  <div class="plupload_file_name" title="屏幕截图 2023-12-12 101722.png">
  屏幕截图 2023-12-12 101722.png
  </div>
  <div class="plupload_file_action">
  <button id="p1hi0h79b814iokk6kucnfsk487-pre-remove" type="button"></button>
  </div>
  <div class="plupload_file_size">123 KB</div>
  <div class="plupload_file_thumbnail_preview_img">
  <img
  src="/k/api/blob/download.do?fileKey=${fileKey}&amp;h=150&amp;w=150&amp;flag=SHRINK&amp;_ref=https%3A%2F%2Fcndevqpofif.cybozu.cn%2Fk%2F221%2Fedit"
  alt="" title="屏幕截图 2023-12-12 101722.png" data-thumbnail-key="slide-11" class="gaia-ui-slideshow-thumbnail" />
  </div>
  <div class="plupload_clearer"></div>
  </div>
  `
  return attachHtmlTemplate
}

function extractFileTypes(obj: any) {
  let result: any = {}
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

async function upFile(fileData: Blob) {
  const APP_ID = '221'
  const ATTACHMENT_FIELD_CODE = 'atta'
  const FILE = {
    name: 'Hello.png',
    data: fileData,
  }

  // Upload a file and attach it to a record
  const { fileKey } = await client.file.uploadFile({
    file: FILE,
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
          // console.log(blob.size)

          const fileKey = await upFile(blob)
          fileKeyVar = fileKey
          const htmlFragment = generateHtmlFragment(fileKey)
          const container = findAttachContainer()
          // console.log(container)

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
      }
    }
  } catch (err) {
    console.error('Failed to read clipboard contents: ', err)
  }
}

const app = () => {
  console.log('monkey jumping on the bed.')

  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], (event) => {
    console.log(event)
    const record = event.record
    let input = {
      // 你的对象
    }

    let result = extractFileTypes(input)
    console.log(result)

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
